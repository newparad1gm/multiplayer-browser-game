import React, { createRef, useCallback, useEffect, useMemo, useState } from 'react';
import { JiraGameApi, JsonResponse } from './JiraGameApi';

enum JiraViewEnum {
    Sprint = 0,
    Issues = 1,
    Issue = 2
}

interface JiraViewProps {
    client: WebSocket;
}

export const JiraView = (props: JiraViewProps): JSX.Element => {
    const { client } = props;
    const jiraGameApi = useMemo(() => new JiraGameApi(process.env.REACT_APP_JIRA_URL!), []);
    const jiraRef = createRef<HTMLDivElement>();
    const [ jiraViewEnum, setJiraViewEnum ] = useState<JiraViewEnum>(JiraViewEnum.Sprint);
    const [ boardId, setBoardId ] = useState<number>(107);
    const [ sprint, setSprint ] = useState<JsonResponse>();
    const [ issueId, setIssueId ] = useState<number>(0);

    const sendToGame = useCallback(() => {
        if (jiraRef.current) {
            client.send(JSON.stringify({ 
                screenData: jiraRef.current.innerHTML
            }));
        }
    }, [client, jiraRef]);

    return (
        <div>
            <div ref={jiraRef}>
                { jiraViewEnum === JiraViewEnum.Sprint && <SprintView jiraGameApi={jiraGameApi} boardId={boardId} setJiraViewEnum={setJiraViewEnum} setSprint={setSprint}/> }
                { jiraViewEnum === JiraViewEnum.Issues && sprint && <IssuesView jiraGameApi={jiraGameApi} boardId={boardId} sprint={sprint} setJiraViewEnum={setJiraViewEnum} setIssueId={setIssueId}/> }
            </div>
            <button onClick={sendToGame}>
                Click to send
            </button>
        </div>
    )
}

interface SprintViewProps {
    boardId: number;
    jiraGameApi: JiraGameApi;
    setJiraViewEnum: React.Dispatch<React.SetStateAction<JiraViewEnum>>;
    setSprint: React.Dispatch<React.SetStateAction<JsonResponse | undefined>>;
}

export const SprintView = (props: SprintViewProps): JSX.Element => {
    const { boardId, jiraGameApi, setJiraViewEnum, setSprint } = props;
    const [ sprints, setSprints ] = useState<JsonResponse[]>([]);

    useEffect(() => {
        const getSprints = async () => {
            const sprints = await jiraGameApi.activeSprints(boardId);
            setSprints(sprints);
        }
        getSprints();
    }, [boardId, jiraGameApi]);

    const openSprint = (sprint: JsonResponse) => {
        setSprint(sprint);
        setJiraViewEnum(JiraViewEnum.Issues);
    }

    return (
        <div>
            Active Sprints:
            { sprints.map(sprint => (
                <div key={sprint.id}>
                    <div onClick={e => openSprint(sprint)}>{sprint.name}</div>
                </div>
            )) }
        </div>
    )
}

interface IssuesViewProps {
    boardId: number;
    sprint: JsonResponse;
    jiraGameApi: JiraGameApi;
    setJiraViewEnum: React.Dispatch<React.SetStateAction<JiraViewEnum>>;
    setIssueId: React.Dispatch<React.SetStateAction<number>>;
}

export const IssuesView = (props: IssuesViewProps): JSX.Element => {
    const { boardId, sprint, jiraGameApi } = props;
    const [ issues, setIssues ] = useState<JsonResponse[]>([]);

    useEffect(() => {
        const getIssues = async () => {
            const issues = await jiraGameApi.issuesForSprint(boardId, sprint.id);
            setIssues(issues);
        }
        getIssues();
    }, [sprint]);

    return (
        <div>
            Issues for Sprint { sprint.name }
            { issues.map(issue => (
                <div key={issue.id}>
                    { issue.key } - Assignee: { issue.fields.assignee?.displayName } - { issue.fields.description }
                </div>
            )) }
        </div>
    )
}