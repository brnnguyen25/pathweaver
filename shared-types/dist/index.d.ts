export interface QuestNode {
    id: string;
    label: string;
    status: "available" | "locked" | "missing-prerequisites";
}
