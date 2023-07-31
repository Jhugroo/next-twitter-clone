import { useForm } from "react-hook-form";
import { api } from "~/utils/api"
import { Button } from "./Button";
import { GetStaticPaths } from "next";
import { LoadingSpinner } from "./LoadingSpinner";
import InfiniteScroll from "react-infinite-scroll-component";
import { FormEvent, useState } from "react";
type TodoList = {
    id: string
    task: string
    complete: boolean
    createdAt: Date
    updatedAt: Date
};
type InfiniteTodosListProps = {
    isLoading: boolean,
    isError: boolean,
    hasMore: boolean | undefined,
    fetchNewTasks: () => Promise<unknown>
    todos?: TodoList[]
}

export function Todolist() {
    const listings = api.todolist.todoListing.useInfiniteQuery({}, { getNextPageParam: (lastPage) => lastPage.nextCursor })
    const [inputValue, setInputValue] = useState("");
    const trpcUtils = api.useContext();
    const createTodo = api.todolist.create.useMutation({
        onSuccess: (task) => {
            setInputValue("");
            trpcUtils.todolist.todoListing.setInfiniteData({}, (oldData) => {
                if (oldData == null || oldData.pages[0] == null) return
                const newCachedTodoList = {
                    ...task,
                };
                return {
                    ...oldData,
                    pages: [
                        {
                            ...oldData.pages[0],
                            todos: [newCachedTodoList, ...oldData.pages[0].todos]
                        },
                        ...oldData.pages.slice(1)
                    ]
                }
            })
        },
    });
    function handleSubmitTodo(e: FormEvent) {
        e.preventDefault();
        inputValue ? createTodo.mutate({ task: inputValue }) : alert('Please enter a task');
    }
    return <>
        <form onSubmit={handleSubmitTodo} className="flex flex-col gap-2 border-2 px-4 py-2">
            <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} className="border" placeholder="Create task" />
            <Button className="self-end">Create task</Button>
        </form>
        <InfiniteTasksList
            todos={listings.data?.pages.flatMap((page) => page.todos)}
            isError={listings.isError}
            isLoading={listings.isLoading}
            hasMore={listings.hasNextPage}
            fetchNewTasks={listings.fetchNextPage}
        />
    </>
}

function InfiniteTasksList({ todos, isError, isLoading, fetchNewTasks, hasMore = false }: InfiniteTodosListProps) {
    if (isLoading) return <LoadingSpinner />;
    if (isError) return <h1>Error...</h1>;
    if (todos == null) return null;
    if (todos == null || todos.length === 0) return <h2 className="my-4 text-center text-2x; text-gray-500">No tasks</h2>;

    return <ul>
        <InfiniteScroll
            dataLength={todos.length}
            next={fetchNewTasks}
            hasMore={hasMore}
            loader={<LoadingSpinner />}>
            {todos.map((todo) => { return <Todo key={todo.id} {...todo} /> })}
        </InfiniteScroll>
    </ul>
}

function Todo({ id, task, complete, createdAt, updatedAt }: TodoList) {
    const dateFormatter = new Intl.DateTimeFormat('en-MU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const createdAtRendered = dateFormatter.format(createdAt);
    const [completeState, setCompleteState] = useState(complete);
    const [updatedAtRendered, setUpdatedAtRendered] = useState(dateFormatter.format(updatedAt));
    const updateTask = api.todolist.updateTask.useMutation({
        onSuccess: ({ task }) => {
            setCompleteState(task.complete);
            setUpdatedAtRendered(dateFormatter.format(task.updatedAt))
        }
    });
    function handleToggleTask() {
        updateTask.mutate({ currentState: completeState, id: id });
    }
    return <>
        <li className="flex gap-4 border px-4 py-4">
            <div className='flex flex-grow flex-col'>
                <div className="flex gap-1">
                    <span className="text-gray-500">    {completeState ? <>created on </> : null}{createdAtRendered}</span>
                </div>
                {completeState ? <span className="text-gray-500"> completed on {updatedAtRendered}</span> : null}
                {task}<br />
                {completeState ? <Button className="self-end" onClick={handleToggleTask} > Undo</Button> : <Button className="self-end" onClick={handleToggleTask} > Set to completed</Button>}
            </div>
        </li>
    </>
}

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: [],
        fallback: "blocking",
    }
}