const fs = require("fs-extra");
const path = require("path");
const glob = require("glob");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const analyzeProject = (projectPath) => {
  const files = glob.sync(`${projectPath}/**/*`, {
    nodir: true,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });
  const analysis = files.map((file) => {
    const content = fs.readFileSync(file, "utf-8");
    return { file, content: content.slice(0, 500) }; // Limit content for brevity
  });
  return analysis;
};

const generateReadme = async (projectAnalysis) => {
  const readmeSections = await Promise.all(
    projectAnalysis.map(async ({ file, content }) => {
      const prompt = `File: ${file}\nContent (truncated):\n${content}\nGenerate a description:`;
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.error(`Error generating content for ${file}:`, error);
        return "";
      }
    })
  );
  return readmeSections.filter((section) => section).join("\n\n");
};

const writeReadme = (projectPath, content) => {
  const readmePath = path.join(projectPath, "README.md");
  fs.writeFileSync(readmePath, content, "utf-8");
  console.log(`README generated at ${readmePath}`);
};

module.exports = async (projectPath) => {
  const analysis = analyzeProject(projectPath);
  const readmeContent = await generateReadme(analysis);
  writeReadme(projectPath, readmeContent);
};
