import { For, Show, createMemo, createSignal } from "solid-js";
import { A, useLocation, useRouteData } from "solid-start";

export default function Pagination(props: any) {
    const DOTS = "...";

    const range = (start: any, end: any) => {
        let length = end - start + 1;
        // Create an array of certain length and set the elements within it from start value to end value.
        return Array.from({ length }, (_, idx) => idx + start);
    };

    const data = useRouteData<typeof props.dataType>();
    const location = useLocation();

    const [paginationSignal, setPaginationSignal] = createSignal({
        currentPage: Number(useLocation().query["page"]) || 1,
        totalCount: Number(data?.latest?.totalForums) || 123123123,
        siblingCount: 1,
        pageSize: Number(data?.latest?.itemsPerPage),
    });

    const usePagination = createMemo(() => {
        const totalPageCount = Math.ceil(paginationSignal().totalCount / paginationSignal().pageSize);

        // Pages count is determined as siblingCount + firstPage + lastPage + currentPage + 2*DOTS
        const totalPageNumbers = paginationSignal().siblingCount + 5;

        /*
                Case 1:
                If the number of pages is less than the page numbers we want to show in our
                paginationComponent, we return the range [1..totalPageCount]
            */
        if (totalPageNumbers >= totalPageCount) {
            return range(1, totalPageCount);
        }

        // Calculate left and right sibling index and make sure they are within range 1 and totalPageCount

        const leftSiblingIndex = Math.max((paginationSignal().currentPage as number) - paginationSignal().siblingCount, 1);
        const rightSiblingIndex = Math.min((paginationSignal().currentPage as number) + paginationSignal().siblingCount, totalPageCount);

        // We do not show dots just when there is just one page number to be inserted between the extremes of sibling and the page limits i.e 1 and totalPageCount. Hence we are using leftSiblingIndex > 2 and rightSiblingIndex < totalPageCount - 2
        const shouldShowLeftDots = leftSiblingIndex > 2;
        const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

        const firstPageIndex = 1;
        const lastPageIndex = totalPageCount;

        // Case 2: No left dots to show, but rights dots to be shown

        if (!shouldShowLeftDots && shouldShowRightDots) {
            let leftItemCount = 3 + 2 * paginationSignal().siblingCount;
            let leftRange = range(1, leftItemCount);

            return [...leftRange, DOTS, totalPageCount];
        }

        // Case 3: No right dots to show, but left dots to be shown

        if (shouldShowLeftDots && !shouldShowRightDots) {
            let rightItemCount = 3 + 2 * paginationSignal().siblingCount;
            let rightRange = range(totalPageCount - rightItemCount + 1, totalPageCount);
            return [firstPageIndex, DOTS, ...rightRange];
        }

        // Case 4: Both left and right dots to be shown

        if (shouldShowLeftDots && shouldShowRightDots) {
            let middleRange = range(leftSiblingIndex, rightSiblingIndex);
            return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
        }
    });

    let lastPage: any;

    if (usePagination()) {
        let length = usePagination()!.length;
        if (paginationSignal().currentPage === 0 || length < 2) {
            return null;
        }
        lastPage = usePagination()![length - 1];
    }

    const onPageChange = (page: number) => {
        setPaginationSignal({
            currentPage: page,
            totalCount: paginationSignal().totalCount,
            siblingCount: paginationSignal().siblingCount,
            pageSize: paginationSignal().pageSize,
        });
    };

    return (
        <div class='pagination-container bg-white dark:bg-baltic-sea-850 dark:text-white'>
            <Show
                when={paginationSignal().currentPage !== 1}
                fallback={
                    <button class={`pagination-item`}>
                        <div class='arrow left opacity-50'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='24'
                                height='24'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                stroke-width='2'
                                stroke-linecap='round'
                                stroke-linejoin='round'
                                class='feather feather-arrow-left'
                            >
                                <line x1='19' y1='12' x2='5' y2='12' />
                                <polyline points='12 19 5 12 12 5' />
                            </svg>
                        </div>
                    </button>
                }
            >
                <A
                    href={`?page=${Number(location.query["page"]) - 1 ?? 1}`}
                    class={`pagination-item`}
                    onClick={() => onPageChange(paginationSignal().currentPage - 1)}
                >
                    <div class='arrow left dark:text-white'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            stroke-width='2'
                            stroke-linecap='round'
                            stroke-linejoin='round'
                            class='feather feather-arrow-left'
                        >
                            <line x1='19' y1='12' x2='5' y2='12' />
                            <polyline points='12 19 5 12 12 5' />
                        </svg>
                    </div>
                </A>
            </Show>
            <For each={usePagination()}>
                {(pageNumber) => {
                    if ((pageNumber as unknown as string) === DOTS) {
                        return <button class='pagination-item dots'>&#8230;</button>;
                    }
                    return (
                        <A
                            href={`?page=${pageNumber}`}
                            class={`pagination-item ${pageNumber === paginationSignal().currentPage && "selected"}`}
                            onClick={() => {
                                onPageChange(pageNumber);
                            }}
                        >
                            {pageNumber}
                        </A>
                    );
                }}
            </For>
            <Show
                when={paginationSignal().currentPage !== lastPage}
                fallback={
                    <button class={`pagination-item`}>
                        <div class='arrow right opacity-50  dark:text-white'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='24'
                                height='24'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                stroke-width='2'
                                stroke-linecap='round'
                                stroke-linejoin='round'
                                class='feather feather-arrow-right'
                            >
                                <line x1='5' y1='12' x2='19' y2='12' />
                                <polyline points='12 5 19 12 12 19' />
                            </svg>
                        </div>
                    </button>
                }
            >
                <A
                    href={`?page=${location.query["page"] ? Number(location.query["page"]) + 1 : 1 + 1}`}
                    class={`pagination-item`}
                    onClick={() => onPageChange(Number(paginationSignal().currentPage) + 1)}
                >
                    <div class='arrow right dark:text-white'>
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            width='24'
                            height='24'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            stroke-width='2'
                            stroke-linecap='round'
                            stroke-linejoin='round'
                            class='feather feather-arrow-right'
                        >
                            <line x1='5' y1='12' x2='19' y2='12' />
                            <polyline points='12 5 19 12 12 19' />
                        </svg>
                    </div>
                </A>
            </Show>
        </div>
    );
}
