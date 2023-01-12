
/*import JiraApi, { JsonResponse } from "jira-client";

export class JiraGameApi {
    jira: JiraApi;

    constructor() {
        this.jira = new JiraApi({
            protocol: 'https',
            host: 'haventech.atlassian.net',
            strictSSL: true
        });
    }

    activeSprints = async (boardId: string): Promise<JsonResponse[]> => {
        const response = await this.jira.getAllSprints(boardId, undefined, undefined, 'active');
        if (response.values && response.values.length) {
            return response.values as JsonResponse[];
        }
        return []
    }
}*/
export interface JsonResponse {
    [name: string]: any;
}

export class JiraGameApi {
    constructor(readonly jiraUrl: string) {}

    activeSprints = async (boardId: number): Promise<JsonResponse[]> => {
        const response = await fetch(`${this.jiraUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        const sprints = await response.json();
        if (sprints.values && sprints.values.length) {
            return sprints.values as JsonResponse[];
        }
        return [];
    }

    issuesForSprint = async (boardId: number, sprintId: number): Promise<JsonResponse[]> => {
        const response = await fetch(`${this.jiraUrl}/rest/agile/1.0/board/${boardId}/sprint/${sprintId}/issue`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        const sprints = await response.json();
        if (sprints.issues && sprints.issues.length) {
            return sprints.issues as JsonResponse[];
        }
        return [];
    }
}