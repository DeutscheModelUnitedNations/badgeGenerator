export enum WarningType {
	SUPERSET = 'SUPERSET',
	IMAGE = 'IMAGE',
	TEXT = 'TEXT'
}

export interface Warning {
	type: WarningType;
	message: string;
	details?: string;
	path: string[];
}

let warnings = $state<Warning[]>([]);

export const resetWarnings = () => {
	warnings = [];
};

export const addWarning = (warning: Warning) => {
	console.log(warning);
	warnings = [...warnings, warning];
};

export const getWarnings = () => {
	return warnings;
};
