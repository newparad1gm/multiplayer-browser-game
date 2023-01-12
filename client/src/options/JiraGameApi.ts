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
        const sprint = await response.json();
        if (sprint.issues && sprint.issues.length) {
            return sprint.issues as JsonResponse[];
        }
        return [];
    }

    getIssue = async (issueId: number): Promise<JsonResponse> => {
        const response = await fetch(`${this.jiraUrl}/rest/agile/1.0/issue/${issueId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        return response.json();
    }
}