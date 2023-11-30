export type RakMadnessScores = {
    tiebreaker: number;
    scores: Array<PlayerScore>;
}

export type PlayerScore = {
        name: string;
        score: {
            total: number;
            college: number;
            pro: number;
            proAgainstTheSpread: number;
        }
        tiebreaker: {
            pick: number;
            distance: number;
        };
        college: Array<PickResult>,
        pro: Array<PickResult>,
        isKnockedOut: boolean;
}

export type PickResult = {
    pick: string;
    status: Status;
}

export type Status = "yes" | "no" | "incomplete" | "error";