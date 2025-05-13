
export interface Institution {
  id: string;
  name: string;
  type: string; // e.g., University, K-12 School, Online Bootcamp
  location: string; // e.g., City, State
  programsOffered: string; // Description or list
  targetAudience: string; // Description
  uniqueSellingPoints: string; // Description
  websiteUrl?: string; // Optional
}

// Default values for a new institution, can be used in forms
export const defaultInstitution: Omit<Institution, 'id'> = {
  name: "",
  type: "",
  location: "",
  programsOffered: "",
  targetAudience: "",
  uniqueSellingPoints: "",
  websiteUrl: "",
};
