import React, { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JiraGameApi, JsonResponse } from './JiraGameApi';

enum JiraViewEnum {
    Sprint = 'Sprint',
    Issues = 'Issues',
    Issue = 'Issue'
}

interface JiraViewProps {
    client: WebSocket;
}

export const JiraView = (props: JiraViewProps): JSX.Element => {
    const { client } = props;
    const jiraGameApi = useMemo(() => new JiraGameApi(process.env.REACT_APP_JIRA_URL!), []);
    const jiraRef = createRef<HTMLDivElement>();
    const [ jiraViewEnum, setJiraViewEnum ] = useState<JiraViewEnum>(JiraViewEnum.Sprint);
    const [ boardId, setBoardId ] = useState<string>('107');
    const [ sprint, setSprint ] = useState<JsonResponse>();
    const [ issueId, setIssueId ] = useState<string>();
    const [ accountId, setAccountId ] = useState<string>();

    const sendToGame = useCallback(() => {
        if (jiraRef.current) {
            client.send(JSON.stringify({ 
                screenData: jiraRef.current.innerHTML
            }));
        }
    }, [client, jiraRef]);

    return (
        <div className='jira-view'>
            <div ref={jiraRef}>
                { jiraViewEnum === JiraViewEnum.Sprint && <SprintView 
                    jiraGameApi={jiraGameApi} 
                    boardId={boardId} 
                    setJiraViewEnum={setJiraViewEnum} 
                    setSprint={setSprint}
                /> }
                { jiraViewEnum === JiraViewEnum.Issues && sprint && <IssuesView 
                    jiraGameApi={jiraGameApi} 
                    boardId={boardId} 
                    sprint={sprint} 
                    accountId={accountId} 
                    setAccountId={setAccountId} 
                    setJiraViewEnum={setJiraViewEnum} 
                    setIssueId={setIssueId}
                /> }
                { jiraViewEnum === JiraViewEnum.Issue && <IssueView 
                    issueId={issueId}
                    jiraGameApi={jiraGameApi} 
                    setJiraViewEnum={setJiraViewEnum} 
                    setAccountId={setAccountId}
                /> }
            </div>
            { jiraViewEnum !== JiraViewEnum.Sprint && <div className='list-item-link' onClick={e => setJiraViewEnum(JiraViewEnum.Sprint)}>Return To Sprints</div> }
            <button onClick={sendToGame}>
                Click to Send
            </button>
        </div>
    )
}

interface SprintViewProps {
    boardId: string;
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
            <div className='list-header'>Active Sprints</div>
            { sprints.map(sprint => (
                <div key={sprint.id}>
                    <span className='list-item-link' onClick={e => openSprint(sprint)}>{sprint.name}</span>: {sprint.startDate} - {sprint.endDate}
                </div>
            )) }
        </div>
    )
}

interface IssuesViewProps {
    boardId: string;
    sprint: JsonResponse;
    jiraGameApi: JiraGameApi;
    accountId?: string;
    setAccountId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setJiraViewEnum: React.Dispatch<React.SetStateAction<JiraViewEnum>>;
    setIssueId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const IssuesView = (props: IssuesViewProps): JSX.Element => {
    const { boardId, sprint, jiraGameApi, accountId, setAccountId, setJiraViewEnum, setIssueId } = props;
    const issuesRef = useRef<JsonResponse[]>([]);
    const [ issuesToDisplay, setIssuesToDisplay ] = useState<JsonResponse[]>([]);

    const filterOnAccount = useCallback((): JsonResponse[] => {
        let issues = issuesRef.current;
        if (accountId) {
            issues = issues.filter(issue => issue.fields.assignee?.accountId === accountId);
        }
        return issues;
    }, [accountId]);

    useEffect(() => {
        const getIssues = async () => {
            const issues = await jiraGameApi.issuesForSprint(boardId, sprint.id);
            issuesRef.current = issues;
            setIssuesToDisplay(filterOnAccount());
        }
        getIssues();
    }, [boardId, sprint, jiraGameApi, filterOnAccount]);

    useEffect(() => {
        setIssuesToDisplay(filterOnAccount());
    }, [accountId, filterOnAccount]);

    return (
        <div>
            <div className='issue-name'>Issues for Sprint { sprint.name }</div>
            <div className='list-item-link list-header' onClick={e => setAccountId(undefined)}>View All</div>
            { issuesToDisplay.map(issue => (
                <IssueListView key={issue.id} issue={issue} setAccountId={setAccountId} setJiraViewEnum={setJiraViewEnum} setIssueId={setIssueId} />
            )) }
        </div>
    )
}

interface IssueListViewProps {
    issue: JsonResponse;
    setAccountId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setJiraViewEnum: React.Dispatch<React.SetStateAction<JiraViewEnum>>;
    setIssueId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const IssueListView = (props: IssueListViewProps): JSX.Element => {
    const { issue, setAccountId, setJiraViewEnum, setIssueId } = props;

    const setIssue = useCallback((issueId: string) => {
        setIssueId(issueId);
        setJiraViewEnum(JiraViewEnum.Issue);
    }, [setIssueId, setJiraViewEnum]);

    return (
        <div className='issue-item'>
            <div>
                <span className='list-item-link' onClick={e => setIssue(issue.id)}>{ issue.key }</span> - 
                Assignee: <span className='list-item-link' onClick={e => setAccountId(issue.fields.assignee?.accountId)}>{ issue.fields.assignee?.displayName }</span>
            </div>
            <div className='issue-summary'>{ issue.fields.summary }</div>
            <div className='issue-description'>{ issue.fields.description }</div>
        </div>
    )
}

interface IssueViewProps {
    issueId?: string,
    jiraGameApi: JiraGameApi;
    setJiraViewEnum: React.Dispatch<React.SetStateAction<JiraViewEnum>>;
    setAccountId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const IssueView = (props: IssueViewProps): JSX.Element | null => {
    const { issueId, jiraGameApi, setJiraViewEnum, setAccountId } = props;
    const [ issue, setIssue ] = useState<JsonResponse>();

    useEffect(() => {
        if (issueId) {
            const getIssue = async () => {
                const issue = await jiraGameApi.getIssue(issueId);
                setIssue(issue);
            }
            getIssue();
        }
    }, [issueId, jiraGameApi]);

    const setIssueAccount = useCallback((accountId?: string) => {
        setAccountId(accountId);
        setJiraViewEnum(JiraViewEnum.Issues);
    }, [setAccountId, setJiraViewEnum]);

    return issue ? (
        <div>
            <div className='issue-summary'><span className='issue-name'>{ issue.key }</span> - { issue.fields.summary }</div>
            <div className='issue-item'>Assignee - <span className='list-item-link' onClick={e => setIssueAccount(issue.fields.assignee?.accountId)}>{ issue.fields.assignee?.displayName }</span></div>
            <div>{ issue.fields.description }</div>
            <div className='list-item-link' onClick={e => setIssueAccount(undefined)}>Return to Issues</div>
        </div> ) :
        null
}