const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const llmProvider = process.env.LLM_DEFAULT_PROVIDER || 'openai';
let aiClient;
let model;

if (llmProvider === 'anthropic') {
  aiClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  model = 'claude-3-opus-20240229';
} else if (llmProvider === 'gemini') {
  aiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = 'gemini-1.5-flash';
} else {
  aiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  model = 'gpt-4';
}


async function generatePRD(projectPath, prompt) {
  console.log(`Generating AI PRD for project at: ${projectPath} using ${llmProvider}`);

  const templatePath = path.join(__dirname, 'templates', 'prd-template.md');
  const template = await fs.readFile(templatePath, 'utf-8');

  // Simple project analysis (can be expanded)
  const analysis = {
    projectName: path.basename(projectPath),
    // Placeholder - In a real scenario, you'd analyze the project to get this
    projectContext: "A web server project using Express.js and TypeScript.",
  };

  const finalPrompt = `
    Project Name: ${analysis.projectName}
    Project Context: ${analysis.projectContext}
    User Prompt: ${prompt}

    Based on the information above, please generate a Product Requirements Document (PRD).
    Fill in the following sections from the PRD template:
    - **Introduction**: A brief overview of the project.
    - **Features**: A list of key features.

    Use the provided template as a base.
  `;

  let aiContent;

  if (llmProvider === 'anthropic') {
    const response = await aiClient.messages.create({
      model: model,
      max_tokens: 4096,
      messages: [{ role: "user", content: finalPrompt }],
    });
    aiContent = response.content[0].text;
  } else if (llmProvider === 'gemini') {
    const genAIModel = aiClient.getGenerativeModel({ model: model });
    const result = await genAIModel.generateContent(finalPrompt);
    const response = await result.response;
    aiContent = response.text();
  } else {
    const response = await aiClient.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: finalPrompt }],
    });
    aiContent = response.choices[0].message.content;
  }


  // This is a simple replacement. A more robust solution would parse the AI output
  // and place it into the correct sections of the template.
  let output = template.replace('{{projectName}}', analysis.projectName);
  // For now, we replace the whole placeholder section with the AI output.
  output = output.replace('{{description}}', `(AI Generated) ${prompt}`);
  output = output.replace('{{features}}', aiContent);


  const outputPath = path.join(projectPath, 'PRD_AI.md');
  await fs.writeFile(outputPath, output);

  console.log(`AI-generated PRD created at: ${outputPath}`);
}

module.exports = { generatePRD };