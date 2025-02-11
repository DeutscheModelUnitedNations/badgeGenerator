let generationMaxPage = $state<number>(0);
let generationCurrentPage = $state<number>(0);

export const setGenerationProgress = (maxPage: number, currentPage: number) => {
	generationMaxPage = maxPage;
	generationCurrentPage = currentPage;
};
export const resetGenerationProgress = (maxPage?: number) => {
	generationMaxPage = maxPage || generationMaxPage;
	generationCurrentPage = 0;
};

export const getGenerationProgress = () => {
	return {
		generationMaxPage,
		generationCurrentPage
	};
};

export const getGenerationProgressText = () => {
	return `${generationCurrentPage}/${generationMaxPage}`;
};

export const getGenerationProgressPercent = () => {
	const progress = Math.floor((generationCurrentPage / generationMaxPage) * 100);
	if (isNaN(progress)) return 0;
	return progress;
};