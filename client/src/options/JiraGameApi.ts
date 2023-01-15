export interface JsonResponse {
    [name: string]: any;
}

export class JiraGameApi {
    constructor(readonly jiraUrl: string, readonly maxResults: number = 50) {}

    fetchJson = async (fetchUrl: string): Promise<JsonResponse> => {
        const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        return response.json();
    }

    activeSprints = async (boardId: string, startAt?: number): Promise<JsonResponse> => {
        return this.fetchJson(`${this.jiraUrl}/rest/agile/1.0/board/${boardId}/sprint?state=active${ startAt ? `&startAt=${startAt}` : '' }`);
    }

    issuesForSprint = async (boardId: string, sprintId: string, startAt?: number): Promise<JsonResponse> => {
        return this.fetchJson(`${this.jiraUrl}/rest/agile/1.0/board/${boardId}/sprint/${sprintId}/issue${ startAt ? `?startAt=${startAt}` : '' }`);
    }

    issuesForBacklog = async (boardId: string, startAt?: number): Promise<JsonResponse> => {
        return this.fetchJson(`${this.jiraUrl}/rest/agile/1.0/board/${boardId}/backlog${ startAt ? `?startAt=${startAt}` : '' }`);
    }

    getBoards = async (startAt?: number): Promise<JsonResponse> => {
        return this.fetchJson(`${this.jiraUrl}/rest/agile/1.0/board?maxResults=${this.maxResults}${ startAt ? `&startAt=${startAt}` : '' }`);
    }

    getIssue = async (issueId: string): Promise<JsonResponse> => {
        return this.fetchJson(`${this.jiraUrl}/rest/agile/1.0/issue/${issueId}`);
    }

    getTransitions = async (issueKey: string): Promise<JsonResponse> => {
        return this.fetchJson(`${this.jiraUrl}/rest/api/3/issue/${issueKey}/transitions`);
    }

    getBoardConfiguration = async (boardId: string): Promise<JsonResponse> => {
        return this.fetchJson(`${this.jiraUrl}/rest/agile/1.0/board/${boardId}/configuration`);
    }

    updateField = async (issueKey: string, customField: string, value: any) => {
        const response = await fetch(`${this.jiraUrl}/rest/api/3/issue/${issueKey}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                update: {
                    [customField]: [ {
                        set: value
                    } ]
                }
            })
        });
        return response.json();
    }

    updateTransition = async (issueKey: string, statusName: string, transitionId: string) => {
        /* 
            needs dummy user-agent or will get XSRF failure on transition endpoint
            if browser's user-agent is read-only from Javascript, then it needs to be manually changed
            instructions found here: https://www.searchenginejournal.com/change-user-agent/368448/
        */
        const response = await fetch(`${this.jiraUrl}/rest/api/2/issue/${issueKey}/transitions`, {
            method: 'POST',
            headers: {
                'User-Agent': 'dummyValue',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                transition: {
                    id: transitionId
                }
            })
        });
        return response.json();
    }
}