export type RakMadnessScores = {
  /** Absent until the Monday night game is final. */
  tiebreaker?: number;
  scores: Array<PlayerScore>;
};

export type PlayerScore = {
  name: string;
  score: {
    total: number;
    college: number;
    pro: number;
    proAgainstTheSpread: number;
  };
  tiebreaker: {
    /** Absent when the player left the Monday night points cell blank. */
    pick?: number;
    /** Absent until both the pick and the Monday night total are known. */
    distance?: number;
  };
  college: Array<PickResult>;
  pro: Array<PickResult>;
  status: {
    hasNoPicks: boolean;
    isKnockedOut: boolean;
    explanation?: string;
  };
};

export type PickResult = {
  pick: string;
  status: Status;
  explanation: {
    header: string;
    message: string;
    downDistanceText?: string;
  };
};

export type Status = "yes" | "no" | "incomplete" | "error";
