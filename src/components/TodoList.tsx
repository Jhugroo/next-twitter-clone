import { useForm } from "react-hook-form";
import { api } from "~/utils/api"
import { Button } from "./Button";
import { GetStaticPaths } from "next";
import { LoadingSpinner } from "./LoadingSpinner";
import InfiniteScroll from "react-infinite-scroll-component";
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
    const createTodo = api.todolist.create.useMutation();
    const { register, handleSubmit } = useForm();
    function handleSubmitTodo(data: any) {
        createTodo.mutate({ task: data.task });
    }
    return <>
        <form onSubmit={handleSubmit(handleSubmitTodo)} className="flex flex-col gap-2 border-2 px-4 py-2">
            <input {...register("task")} className="border" placeholder="Create task" />
            <Button className="self-end">task</Button>
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

    if (todos == null || todos.length === 0) {
        return <h2 className="my-4 text-center text-2x; text-gray-500">No tweets</h2>;
    }

    return <ul>
        <InfiniteScroll
            dataLength={todos.length}
            next={fetchNewTasks}
            hasMore={hasMore}
            loader={<LoadingSpinner />}>
            {
                todos.map((todo) => {
                    return <Todo key={todo.id} {...todo} />
                })}
        </InfiniteScroll>
    </ul>
}
function Todo({ id, task, complete, createdAt, updatedAt }: TodoList) {
    const dateFormatter = new Intl.DateTimeFormat('en-MU', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const updatedAtRendered = dateFormatter.format(updatedAt);
    const createdAtRendered = dateFormatter.format(createdAt);
    const updateTask = api.todolist.updateTask.useMutation();
    function handleToggleTask() {
        updateTask.mutate({ currentState: complete, id: id });
    }
    return <>
        <li className="flex gap-4 border px-4 py-4">
            <div className='flex flex-grow flex-col'>
                <div className="flex gap-1">
                    <span className="text-gray-500">{createdAtRendered}</span>
                </div>
                {task}<br />
                {complete ? <h1>done</h1> : <h1>not done</h1>}
                <Button className="self-end" onClick={handleToggleTask} > Toggle Task</Button>
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