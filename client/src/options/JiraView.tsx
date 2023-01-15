import React, { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { JiraGameApi, JsonResponse } from './JiraGameApi';

enum JiraViewEnum {
    Boards = 'Boards',
    Sprints = 'Sprints',
    Issues = 'Issues',
    Issue = 'Issue'
}

interface JiraViewProps {
    client: WebSocket;
    jiraUrl: string;
}

export const JiraView = (props: JiraViewProps): JSX.Element => {
    const { client, jiraUrl } = props;
    const jiraGameApi = useMemo(() => new JiraGameApi(jiraUrl), [jiraUrl]);
    const jiraRef = createRef<HTMLDivElement>();
    const [ jiraViewEnum, setJiraViewEnum ] = useState<JiraViewEnum>(JiraViewEnum.Boards);
    const [ boardId, setBoardId ] = useState<string>();
    const [ board, setBoard ] = useState<JsonResponse>();
    const [ sprint, setSprint ] = useState<JsonResponse | undefined>();
    const [ issueId, setIssueId ] = useState<string>();
    const [ accountId, setAccountId ] = useState<string>();

    const sendToGame = useCallback(() => {
        if (jiraRef.current) {
            client.send(JSON.stringify({ 
                screenData: jiraRef.current.innerHTML
            }));
        }
    }, [client, jiraRef]);

    const viewBacklog = useCallback(() => {
        setJiraViewEnum(JiraViewEnum.Issues);
        setSprint(undefined);
    }, [setSprint, setJiraViewEnum]);

    useEffect(() => {
        if (boardId) {
            const getBoard = async () => {
                const board = await jiraGameApi.getBoardConfiguration(boardId);
                setBoard(board);
            }
            getBoard();
        }
    }, [boardId, jiraGameApi]);

    return (
        <div className='jira-view'>
            <div ref={jiraRef}>
                { jiraViewEnum === JiraViewEnum.Boards && <BoardView 
                    jiraGameApi={jiraGameApi} 
                    setBoardId={setBoardId} 
                    setJiraViewEnum={setJiraViewEnum} 
                /> }
                { jiraViewEnum === JiraViewEnum.Sprints && boardId && <SprintView 
                    jiraGameApi={jiraGameApi} 
                    boardId={boardId} 
                    setJiraViewEnum={setJiraViewEnum} 
                    setSprint={setSprint}
                /> }
                { jiraViewEnum === JiraViewEnum.Issues && boardId && <IssuesView 
                    jiraGameApi={jiraGameApi} 
                    boardId={boardId} 
                    sprint={sprint} 
                    accountId={accountId} 
                    setAccountId={setAccountId} 
                    setJiraViewEnum={setJiraViewEnum} 
                    setIssueId={setIssueId}
                /> }
                { jiraViewEnum === JiraViewEnum.Issue && board && issueId && <IssueView 
                    issueId={issueId}
                    jiraGameApi={jiraGameApi} 
                    board={board}
                    setJiraViewEnum={setJiraViewEnum} 
                    setAccountId={setAccountId}
                /> }
            </div>
            { jiraViewEnum === JiraViewEnum.Sprints && <div className='list-item-link' onClick={viewBacklog}>View Backlog</div> }
            { jiraViewEnum !== JiraViewEnum.Sprints && jiraViewEnum !== JiraViewEnum.Boards && <div className='list-item-link' onClick={e => setJiraViewEnum(JiraViewEnum.Sprints)}>Return To Sprints</div> }
            { jiraViewEnum !== JiraViewEnum.Boards && <div className='list-item-link' onClick={e => setJiraViewEnum(JiraViewEnum.Boards)}>Return To Boards</div> }
            <button onClick={sendToGame}>
                Click to Send
            </button>
        </div>
    )
}

interface PaginationProps {
    maxResults: number;
    total: number;
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
}

export const Pagination = (props: PaginationProps): JSX.Element => {
    const { maxResults, total, page, setPage } = props;

    const goForward = useCallback(() => {
        setPage(page + maxResults);
    }, [page, maxResults, setPage]);

    const goBack = useCallback(() => {
        setPage(page - maxResults);
    }, [page, maxResults, setPage]);
    
    return (
        <div className='pagination-div'>
            { page > 0 && <span className='list-item-link pagination-link' onClick={goBack}>Back</span> }
            { page + maxResults < total && <span className='list-item-link' onClick={goForward}>Next</span> }
        </div>
    )
}

interface BoardViewProps {
    jiraGameApi: JiraGameApi;
    setJiraViewEnum: React.Dispatch<React.SetStateAction<JiraViewEnum>>;
    setBoardId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export const BoardView = (props: BoardViewProps): JSX.Element => {
    const { jiraGameApi, setJiraViewEnum, setBoardId } = props;
    const [ boards, setBoards ] = useState<JsonResponse[]>([]);
    const [ page, setPage ] = useState<number>(0);
    const totalRef = useRef<number>(0);

    useEffect(() => {
        const getBoards = async () => {
            const boards = await jiraGameApi.getBoards(page);
            totalRef.current = boards.total;
            setBoards(boards.values);
        }
        getBoards();
    }, [page, jiraGameApi]);

    const openSprints = useCallback((boardId: string) => {
        setBoardId(boardId)
        setJiraViewEnum(JiraViewEnum.Sprints);
    }, [setBoardId, setJiraViewEnum]);

    return (
        <div>
            <div className='list-header'>Boards</div>
            { boards.map(board => (
                <div key={board.id} className='list-item-link' onClick={e => openSprints(board.id)}>{ board.name }</div>
            )) }
            <Pagination maxResults={jiraGameApi.maxResults} total={totalRef.current} page={page} setPage={setPage}/>
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
    const [ page, setPage ] = useState<number>(0);
    const totalRef = useRef<number>(0);

    useEffect(() => {
        const getSprints = async () => {
            const sprints = await jiraGameApi.activeSprints(boardId, page);
            totalRef.current = sprints.total;
            setSprints(sprints.values);
        }
        getSprints();
    }, [page, boardId, jiraGameApi]);

    const openSprint = useCallback((sprint: JsonResponse) => {
        setSprint(sprint);
        setJiraViewEnum(JiraViewEnum.Issues);
    }, [setSprint, setJiraViewEnum]);

    return (
        <div>
            <div className='list-header'>Active Sprints</div>
            { sprints.map(sprint => (
                <div key={sprint.id}>
                    <span className='list-item-link' onClick={e => openSprint(sprint)}>{sprint.name}</span>: {sprint.startDate} - {sprint.endDate}
                </div>
            )) }
            <Pagination maxResults={jiraGameApi.maxResults} total={totalRef.current} page={page} setPage={setPage}/>
        </div>
    )
}

interface IssuesViewProps {
    boardId: string;
    sprint?: JsonResponse;
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
    const [ page, setPage ] = useState<number>(0);
    const totalRef = useRef<number>(0);

    const filterOnAccount = useCallback((): JsonResponse[] => {
        let issues = issuesRef.current;
        if (accountId) {
            issues = issues.filter(issue => issue.fields.assignee?.accountId === accountId);
        }
        return issues;
    }, [accountId]);

    useEffect(() => {
        const getIssues = async () => {
            let issues: JsonResponse;
            if (sprint) {
                issues = await jiraGameApi.issuesForSprint(boardId, sprint.id, page);
            } else {
                issues = await jiraGameApi.issuesForBacklog(boardId, page);
            }
            totalRef.current = issues.total;
            issuesRef.current = issues.issues;
            setIssuesToDisplay(filterOnAccount());
        }
        getIssues();
    }, [page, boardId, sprint, jiraGameApi, filterOnAccount]);

    useEffect(() => {
        setIssuesToDisplay(filterOnAccount());
    }, [accountId, filterOnAccount]);

    return (
        <div>
            { sprint ? <div className='issue-name'>Issues for Sprint { sprint.name }</div> : <div className='issue-name'>Issues for Backlog</div> }
            <div className='list-item-link list-header' onClick={e => setAccountId(undefined)}>View All</div>
            { issuesToDisplay.map(issue => (
                <IssueListView key={issue.id} issue={issue} setAccountId={setAccountId} setJiraViewEnum={setJiraViewEnum} setIssueId={setIssueId} />
            )) }
            <Pagination maxResults={jiraGameApi.maxResults} total={totalRef.current} page={page} setPage={setPage}/>
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
            <div className='issue-summary'>Status: { issue.fields.status?.name }</div>
            <div className='issue-description'>{ issue.fields.description }</div>
        </div>
    )
}

interface IssueViewProps {
    issueId: string;
    jiraGameApi: JiraGameApi;
    board: JsonResponse;
    setJiraViewEnum: React.Dispatch<React.SetStateAction<JiraViewEnum>>;
    setAccountId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

enum IssueViewEnum {
    Status = 'Status',
    Points = 'Points'
}

export const IssueView = (props: IssueViewProps): JSX.Element | null => {
    const { issueId, jiraGameApi, board, setJiraViewEnum, setAccountId } = props;
    const [ issue, setIssue ] = useState<JsonResponse>();
    const [ issueViewEnum, setIssueViewEnum ] = useState<IssueViewEnum>(IssueViewEnum.Status);
    const [ estimation, setEstimation ] = useState<number>();
    const [ estimationName, setEstimationName ] = useState<string>();
    const [ status, setStatus ] = useState<string>();
    const estimationField = useRef<string>();

    const setIssueAccount = useCallback((accountId?: string) => {
        setAccountId(accountId);
        setJiraViewEnum(JiraViewEnum.Issues);
    }, [setAccountId, setJiraViewEnum]);

    const setStatusName = useCallback((status: JsonResponse) => {
        status ? setStatus(`${status.statusCategory.name} - ${status.name}`) : setStatus(undefined);
    }, []);

    useEffect(() => {
        if (issueId) {
            const getIssue = async () => {
                const issue = await jiraGameApi.getIssue(issueId);
                setIssue(issue);
                setStatusName(issue.fields.status);
            }
            getIssue();
        }
    }, [issueId, jiraGameApi, setStatusName]);

    useEffect(() => {
        const field = board.estimation?.field;
        if (field && issue) {
            estimationField.current = field.fieldId;
            estimationField.current && setEstimation(issue.fields[estimationField.current]);
            setEstimationName(field.displayName);
        }
    }, [issue, board, estimationField]);

    return issue ? (
        <div>
            <div className='issue-summary'><span className='issue-name'>{ issue.key }</span> - { issue.fields.summary }</div>
            <div className='issue-item'>Assignee: <span className='list-item-link' onClick={e => setIssueAccount(issue.fields.assignee?.accountId)}>{ issue.fields.assignee?.displayName }</span></div>
            <div className='issue-item'>Status: { status }</div>
            <div>{ issue.fields.description }</div>
            <div className='issue-estimation'>{ estimationName }: { estimation }</div>
            { issueViewEnum === IssueViewEnum.Points && (<div>
                <EstimationView issue={issue} jiraGameApi={jiraGameApi} board={board} setEstimation={setEstimation}/>
                <div className='list-item-link' onClick={e => setIssueViewEnum(IssueViewEnum.Status)}>View Status</div>
            </div>) }
            { issueViewEnum === IssueViewEnum.Status && (<div>
                <StatusView issue={issue} jiraGameApi={jiraGameApi} board={board} setStatusName={setStatusName}/> 
                <div className='list-item-link' onClick={e => setIssueViewEnum(IssueViewEnum.Points)}>View Estimation</div>
            </div>) }
            <div className='list-item-link' onClick={e => setIssueAccount(undefined)}>Return to Issues</div>
        </div> ) :
        null
}

interface EstimationViewProps {
    issue: JsonResponse;
    jiraGameApi: JiraGameApi;
    board: JsonResponse;
    setEstimation: React.Dispatch<React.SetStateAction<number | undefined>>;
}

export const EstimationView = (props: EstimationViewProps): JSX.Element => {
    const { issue, jiraGameApi, board, setEstimation } = props;

    const setStoryPoints = useCallback((points: number) => {
        const estimationField = board.estimation?.field?.fieldId;
        if (estimationField && issue) {
            const updateField = async () => {
                await jiraGameApi.updateField(issue.id, estimationField, points);
                setEstimation(points);
            }
            updateField();
        }
    }, [issue, board, jiraGameApi, setEstimation]);

    return (
        <div>
            <div className='story-point-box' onClick={e => setStoryPoints(1)}>1</div> 
            <div className='story-point-box' onClick={e => setStoryPoints(2)}>2</div> 
            <div className='story-point-box' onClick={e => setStoryPoints(3)}>3</div> 
            <div className='story-point-box' onClick={e => setStoryPoints(5)}>5</div> 
            <div className='story-point-box' onClick={e => setStoryPoints(8)}>8</div> 
            <div className='story-point-box' onClick={e => setStoryPoints(13)}>13</div>
        </div>
    )
}

interface StatusViewProps {
    issue: JsonResponse;
    jiraGameApi: JiraGameApi;
    board: JsonResponse;
    setStatusName: (status: JsonResponse) => void;
}

export const StatusView = (props: StatusViewProps): JSX.Element => {
    const { issue, jiraGameApi, board, setStatusName } = props;
    const [ columns, setColumns ] = useState<JsonResponse[]>([]);
    const statusTransitionMapRef = useRef<Map<string, JsonResponse>>(new Map());

    useEffect(() => {
        const columns = board.columnConfig.columns;
        if (columns) {
            setColumns(columns);
            const getTransitions = async () => {
                const response = await jiraGameApi.getTransitions(issue.key);
                const transitions: JsonResponse[] = response.transitions;
                if (transitions) {
                    //const statusMap = new Map(transitions.map(transition => [transition.to.id as string, transition]));
                    statusTransitionMapRef.current = new Map(transitions.map(transition => [transition.to.id as string, transition]));
                }
            }
            getTransitions();
        }
    }, [board, issue, jiraGameApi]);

    return (
        <div className='status-columns'>
            { columns.map(column => (
                <div className='status-column'>
                    <div>{ column.name }</div>
                    <StatusColumn column={column} statusTransitionMapRef={statusTransitionMapRef} issue={issue} jiraGameApi={jiraGameApi} setStatusName={setStatusName}/>
                </div>
            )) }
        </div>
    )
}

interface StatusColumnProps {
    column: JsonResponse;
    statusTransitionMapRef: React.MutableRefObject<Map<string, JsonResponse>>;
    issue: JsonResponse;
    jiraGameApi: JiraGameApi;
    setStatusName: (status: JsonResponse) => void;
}

export const StatusColumn = (props: StatusColumnProps): JSX.Element => {
    const { column, statusTransitionMapRef, issue, jiraGameApi, setStatusName } = props;
    const [ statuses, setStatuses ] = useState<JsonResponse[]>([]);

    const updateTransition = useCallback((status: JsonResponse) => {
        const statusId = status.id;
        const statusTransitionMap = statusTransitionMapRef.current;
        if (statusId && issue && statusTransitionMap.has(statusId)) {
            const updateField = async () => {
                const transition = statusTransitionMap.get(statusId);
                if (transition) {
                    await jiraGameApi.updateTransition(issue.key, status.name, transition.id);
                    setStatusName(status);
                }
            }
            updateField();
        }
    }, [issue, statusTransitionMapRef, jiraGameApi, setStatusName]);

    useEffect(() => {
        const getStatuses = async () => {
            const statuses = await Promise.all(column.statuses.map((status: JsonResponse) => jiraGameApi.fetchJson(status.self)));
            setStatuses(statuses);
        }
        getStatuses();
    }, [column, jiraGameApi]);

    return (
        <div>
            { statuses.map(status => (
                <div className='status-box' onClick={e => updateTransition(status)}>{ status.name }</div> 
            )) }
        </div>
    )
}