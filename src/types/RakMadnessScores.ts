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
}

export type PickResult = {
    pick: string;
    correct: Correctness;
}

export type Correctness = "yes" | "no" | "unknown";