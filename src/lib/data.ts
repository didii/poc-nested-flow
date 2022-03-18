export interface FieldInfo {
    index: number;
    method?: 'ABC' | 'DEF';
    isAbc?: boolean;
    isDef?: boolean;
}

export interface Data {
    count: number;
    isInitialized?: boolean;
    isFinalized?: boolean;
    futureFields?: { index: number; }[];
    currentField?: FieldInfo;
    finishedFields: FieldInfo[];
}
