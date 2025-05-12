export interface UserData {
    frontendInterviewAgent: FrontendInterviewAgent;
}

export interface FrontendInterviewAgent {
    instructions: string;
    modelId:      string;
    name:         string;
    provider:     string;
    tools:        Tools;
}

export interface Tools {
    feedbackTool:              Tool;
    getAnswerTool:             Tool;
    getInterviewQuestionsTool: Tool;
    importQuestionsTool:       Tool;
    uploadCustomQuestionTool:  Tool;
}

export interface Tool {
    description:  string;
    id:           string;
    inputSchema:  string;
    outputSchema: string;
}
