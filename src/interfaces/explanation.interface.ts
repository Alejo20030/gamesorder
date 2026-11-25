export interface Explanation {
  _id: string;
  /** Markdown. Convert with markdownToPlainText before splitting into words. */
  explanationText: string;
  questionId: string;
  createdBy: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
