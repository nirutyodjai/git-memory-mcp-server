import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit, StatusResult } from 'simple-git';

interface FileNode {
  title: string;
  key: string;
  gitStatus?: string;
  children?: FileNode[];
}

const getGitStatus = (projectRoot: string, status: StatusResult, filePath: string): string | undefined => {
  const relativePath = path.relative(projectRoot, filePath);
  if (status.isClean()) return undefined;
  if (status.created.includes(relativePath)) return 'A';
  if (status.modified.includes(relativePath)) return 'M';
  if (status.deleted.includes(relativePath)) return 'D';
  if (status.conflicted.includes(relativePath)) return 'C';
  if (status.renamed.some(r => r.to === relativePath)) return 'R';
    if (status.staged.includes(relativePath)) return 'S';
  if (status.not_added.includes(relativePath)) return 'U';
  return undefined;
}

const readDirRecursive = (dir: string, projectRoot: string, gitStatus: StatusResult): FileNode[] => {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);
    
    // Ignore node_modules and .git directories
    if (dirent.name === 'node_modules' || dirent.name === '.git') {
      continue;
    }

    const node: FileNode = {
      title: dirent.name,
      key: fullPath,
      gitStatus: getGitStatus(projectRoot, gitStatus, fullPath),
    };

    if (dirent.isDirectory()) {
      node.children = readDirRecursive(fullPath, projectRoot, gitStatus);
    }

    nodes.push(node);
  }

  return nodes;
};

export default async function (fastify: FastifyInstance, opts: FastifyPluginOptions) {
  fastify.get('/files', async (request: FastifyRequest, reply: FastifyReply) => {
    const projectRoot = path.resolve(process.cwd(), '..', '..');
    const git: SimpleGit = simpleGit(projectRoot);
    const gitStatus = await git.status();
    const fileTree = readDirRecursive(projectRoot, projectRoot, gitStatus);
    return fileTree;
  });
}