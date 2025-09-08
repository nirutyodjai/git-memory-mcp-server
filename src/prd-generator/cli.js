#!/usr/bin/env node

const { generatePRD } = require('./index');

const projectPath = process.cwd();
const prompt = process.argv.slice(2).join(' ');

if (!prompt) {
  console.error('Please provide a prompt for the AI PRD generation.');
  process.exit(1);
}

generatePRD(projectPath, prompt).catch(console.error);