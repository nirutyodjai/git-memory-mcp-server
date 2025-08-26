import { AgentOperationType, AppConnectionScope, AppConnectionStatus, AppConnectionType, assertNotNullOrUndefined, ConnectionOperationType, DiffState, FieldState, FieldType, FileCompression, FileId, FileType, FlowProjectOperationType, FlowSyncError, isNil, ProjectId, ProjectState, TableOperationType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentsService } from '../../../../agents/agents-service'
import { appConnectionService } from '../../../../app-connection/app-connection-service/app-connection-service'
import { fileService } from '../../../../file/file.service'
import { flowRepo } from '../../../../flows/flow/flow.repo'
import { flowService } from '../../../../flows/flow/flow.service'
import { mcpService } from '../../../../mcp/mcp-service'
import { fieldService } from '../../../../tables/field/field.service'
import { tableService } from '../../../../tables/table/table.service'
import { projectStateHelper } from './project-state-helper'

export const projectStateService = (log: FastifyBaseLogger) => ({
    async apply({ projectId, diffs, platformId }: ApplyProjectStateRequest): Promise<void> {
        const { flows, connections, tables, agents } = diffs
        const publishJobs: Promise<FlowSyncError | null>[] = []
        for (const state of connections) {
            switch (state.type) {
                case ConnectionOperationType.CREATE_CONNECTION: {
                    await appConnectionService(log).upsert({
                        scope: AppConnectionScope.PROJECT,
                        platformId,
                        projectIds: [projectId],
                        externalId: state.connectionState.externalId,
                        displayName: state.connectionState.displayName,
                        pieceName: state.connectionState.pieceName,
                        type: AppConnectionType.NO_AUTH,
                        status: AppConnectionStatus.MISSING,
                        value: {
                            type: AppConnectionType.NO_AUTH,
                        },
                        ownerId: null,
                    })
                    break
                }
                case ConnectionOperationType.UPDATE_CONNECTION: {
                    const existingConnection = await appConnectionService(log).getOne({
                        externalId: state.newConnectionState.externalId,
                        platformId,
                        projectId,
                    })
                    if (!isNil(existingConnection)) {
                        await appConnectionService(log).update({
                            projectIds: [projectId],
                            platformId,
                            id: existingConnection.id,
                            scope: AppConnectionScope.PROJECT,
                            request: {
                                displayName: state.newConnectionState.displayName,
                                projectIds: null,
                            },
                        })
                    }
                    break
                }
            }
        }

        for (const operation of tables) {
            switch (operation.type) {
                case TableOperationType.CREATE_TABLE: {
                    const table = await tableService.create({
                        projectId,
                        request: {
                            name: operation.tableState.name,
                            externalId: operation.tableState.externalId,
                        },
                    })

                    await Promise.all(operation.tableState.fields.map(async (field) => {
                        await handleCreateField(projectId, field, table.id)
                    }))
                    break
                }
                case TableOperationType.UPDATE_TABLE: {
                    const table = await tableService.update({
                        projectId,
                        id: operation.tableState.id,
                        request: {
                            name: operation.newTableState.name,
                        },
                    })

                    const fields = await fieldService.getAll({
                        projectId,
                        tableId: table.id,
                    })

                    await Promise.all(operation.newTableState.fields.map(async (field) => {
                        const existingField = fields.find((f) => f.externalId === field.externalId)
                        if (!isNil(existingField)) {
                            await fieldService.update({
                                projectId,
                                id: existingField.id,
                                request: field,
                            })
                        }
                        else {
                            await handleCreateField(projectId, field, table.id)
                        }
                    }))

                    const fieldsToDelete = fields.filter((f) => !operation.newTableState.fields.some((nf) => nf.externalId === f.externalId))

                    await Promise.all(fieldsToDelete.map(async (field) => {
                        await fieldService.delete({
                            id: field.id,
                            projectId,
                        })
                    }))
                    break
                }
                case TableOperationType.DELETE_TABLE: {
                    const table = await tableService.getOneByExternalIdOrThrow({
                        externalId: operation.tableState.externalId,
                        projectId,
                    })
                    await tableService.delete({
                        id: table.id,
                        projectId,
                    })
                    break
                }
            }
        }

        for (const operation of flows) {
            switch (operation.type) {
                case FlowProjectOperationType.UPDATE_FLOW: {
                    const flowUpdated = await projectStateHelper(log).updateFlowInProject(operation.flowState, operation.newFlowState, projectId)
                    publishJobs.push(projectStateHelper(log).republishFlow({ flow: flowUpdated, projectId }))
                    break
                }
                case FlowProjectOperationType.CREATE_FLOW: {
                    const flowCreated = await projectStateHelper(log).createFlowInProject(operation.flowState, projectId)
                    publishJobs.push(projectStateHelper(log).republishFlow({ flow: flowCreated, projectId }))
                    break
                }
                case FlowProjectOperationType.DELETE_FLOW: {
                    await projectStateHelper(log).deleteFlowFromProject(operation.flowState.id, projectId)
                    break
                }
            }
        }

        for (const operation of agents) {
            switch (operation.type) {
                case AgentOperationType.CREATE_AGENT: {
                    const createdAgent = await agentsService(log).create({
                        displayName: operation.agentState.displayName,
                        description: operation.agentState.description,
                        profilePictureUrl: operation.agentState.profilePictureUrl,
                        systemPrompt: operation.agentState.systemPrompt,
                        outputType: operation.agentState.outputType,
                        outputFields: operation.agentState.outputFields,
                        platformId,
                        projectId,
                        externalId: operation.agentState.externalId,
                        mcpExternalId: operation.agentState.mcp.externalId,
                    })

                    const mcpState = operation.agentState.mcp
                    await mcpService(log).update({
                        mcpId: createdAgent.mcpId,
                        name: mcpState.name,
                        tools: mcpState.tools,
                    })
                    break
                }
                case AgentOperationType.UPDATE_AGENT: {
                    const existingAgent = await agentsService(log).getOneByExternalIdOrThrow({
                        externalId: operation.newAgentState.externalId,
                        projectId,
                    })

                    await agentsService(log).update({
                        id: existingAgent.id,
                        displayName: operation.newAgentState.displayName,
                        systemPrompt: operation.newAgentState.systemPrompt,
                        description: operation.newAgentState.description,
                        outputType: operation.newAgentState.outputType,
                        outputFields: operation.newAgentState.outputFields,
                        projectId,
                    })

                    const mcpState = operation.newAgentState.mcp
                    await mcpService(log).update({
                        mcpId: existingAgent.mcpId,
                        name: mcpState.name,
                        tools: mcpState.tools,
                    })
                    break
                }
                case AgentOperationType.DELETE_AGENT: {
                    const agent = await agentsService(log).getOneByExternalIdOrThrow({
                        externalId: operation.agentState.externalId,
                        projectId,
                    })
                    await agentsService(log).delete({
                        id: agent.id,
                        projectId,
                    })
                    break
                }
            }
        }
    },
    async save(projectId: ProjectId, name: string, log: FastifyBaseLogger): Promise<FileId> {
        const fileToSave: ProjectState = await this.getCurrentState(projectId, log)

        const fileData = Buffer.from(JSON.stringify(fileToSave))

        const file = await fileService(log).save({
            projectId,
            type: FileType.PROJECT_RELEASE,
            fileName: `${name}.json`,
            size: fileData.byteLength,
            data: fileData,
            compression: FileCompression.NONE,
        })
        return file.id
    },
    async getStateFromRelease(projectId: ProjectId, fileId: FileId, log: FastifyBaseLogger): Promise<ProjectState> {
        const file = await fileService(log).getFileOrThrow({
            projectId,
            fileId,
            type: FileType.PROJECT_RELEASE,
        })
        return JSON.parse(file.data.toString()) as ProjectState
    },
    async getCurrentState(projectId: ProjectId, log: FastifyBaseLogger): Promise<ProjectState> {
        const flows = await flowRepo().find({
            where: {
                projectId,
            },
        })
        const allPopulatedFlows = await Promise.all(flows.map(async (flow) => {
            return flowService(log).getOnePopulatedOrThrow({
                id: flow.id,
                projectId,
            })
        }))
        const connections = await appConnectionService(log).getManyConnectionStates({
            projectId,
        })

        const tables = await tableService.list({
            projectId,
            cursor: undefined,
            limit: 1000,
            name: undefined,
            externalIds: undefined,
        })
        const allPopulatedTables = await Promise.all(tables.data.map(async (table) => {
            const fields = await fieldService.getAll({
                projectId,
                tableId: table.id,
            })
            return {
                ...table,
                fields,
            }
        }))

        const agents = await agentsService(log).list({
            projectId,
            limit: 1000,
            cursorRequest: null,
        })

        return {
            flows: allPopulatedFlows,
            connections,
            tables: allPopulatedTables,
            agents: agents.data,
        }
    },
})

async function handleCreateField(projectId: ProjectId, field: FieldState, tableId: string) {
    switch (field.type) {
        case FieldType.STATIC_DROPDOWN: {
            assertNotNullOrUndefined(field.data, 'Data is required for static dropdown field')
            await fieldService.create({
                projectId,
                request: {
                    name: field.name,
                    type: field.type,
                    tableId,
                    data: field.data,
                    externalId: field.externalId,
                },
            })
            break
        }
        case FieldType.DATE:
        case FieldType.NUMBER:
        case FieldType.TEXT: {
            await fieldService.create({
                projectId,
                request: {
                    name: field.name,
                    type: field.type,
                    tableId,
                    externalId: field.externalId,
                },
            })
            break
        }
    }
}

type ApplyProjectStateRequest = {
    projectId: string
    diffs: DiffState
    log: FastifyBaseLogger
    platformId: string
}
