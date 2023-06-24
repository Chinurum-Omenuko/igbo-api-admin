interface LinearProgressCard {
  heading: string;
  description?: string;
  stats: {
    totalCount: number;
    goal: number;
    heading: string;
    description: string;
  }[];
  isLoaded: boolean;
  isGeneric?: boolean;
}

export default LinearProgressCard;
