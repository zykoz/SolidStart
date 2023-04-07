import { createServerAction$, createServerData$ } from "solid-start/server";
import { refetchRouteData, useRouteData, RouteDataArgs } from "solid-start";
import { db } from "~/db";
import ForumList from "~/components/ForumList";
import CreateTopic from "~/components/CreateTopic";
import Folder from "~/components/Folders";
import TopicHelper from "~/components/TopicHelper";
import { Show } from "solid-js";
import { getUserId } from "~/db/session";
import Pagination from "~/components/Pagination";

export function routeData({ location }: RouteDataArgs) {
    return createServerData$(
        async ([, page]) => {
            const itemsPerPage = 5;
            const forums = await db.forum.findMany({
                take: itemsPerPage,
                skip: itemsPerPage * (Math.max(Number(page) - 1, 0) || 0),
                include: {
                    topics: {
                        select: {
                            id: true,
                            title: true,
                            createdAt: true,
                        },
                    },
                    createdBy: {
                        select: {
                            username: true,
                        },
                    },
                },
            });
            const totalForums = await db.forum.count();
            return { forums, totalForums, itemsPerPage };
        },
        { key: () => ["f", location.query["page"]] }
    );
}

export default function ForumsPage() {
    let data = useRouteData<typeof routeData>();
    let forumId = data.latest?.forums[0]?.id ? data.latest?.forums[0]?.id : "No_Forum";

    const [creatingForum, { Form }] = createServerAction$(async (form: FormData, { request }) => {
        const name = form.get("forumName") as string;
        const userId = await getUserId(request);

        if (userId === null) {
            throw new Error("User ID not found in cookie");
        }

        await db.forum.create({
            data: {
                name: name,
                createdById: Number(userId),
            },
        });

        refetchRouteData();
    });

    return (
        <div>
            <Form class='w-max border border-black'>
                <input class='dark:text-black' name='forumName' />
                <button type='submit' disabled={creatingForum.pending}>
                    CreateForum
                </button>
            </Form>
            <Show when={creatingForum.pending}>
                <div>Creating Edge Forum...</div>
            </Show>
            <Show when={creatingForum.error}>
                <div>{creatingForum.error.message}</div>
                <button onClick={() => creatingForum.retry()}>Retry</button>
            </Show>
            <CreateTopic placeholder='Create Forum' link='/create_forum' identifier={forumId} />

            <TopicHelper />
            <Folder />
            <ForumList dataType={typeof routeData} />
            <Pagination dataType={typeof routeData} />
        </div>
    );
}
