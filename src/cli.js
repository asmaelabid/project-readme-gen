#!/usr/bin/env node

const { Command } = require('commander');
const generateReadme = require('./index');

const program = new Command();

program
    .argument('<path>', 'Path to the project directory')
    .description('Generate a README for your project')
    .action(async (path) => {
        try {
            await generateReadme(path);
        } catch (err) {
            console.error('Error generating README:', err.message);
        }
    });

program.parse(process.argv);
