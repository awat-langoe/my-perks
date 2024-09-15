import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  WithFieldValue,
} from "firebase-admin/firestore";

export interface Source {
  id: string;
  url: string;
  htmlElements?: {
    perkSelector: string;
    titleSelector: string;
    titleElementAttribute?: string;
    descriptionSelector?: string;
    discountSelectors?: string[];
    waitForSelector?: string;
  };
  jsonProperties?: {
    perksProperty: string;
    titleProperty: string;
    descriptionProperty?: string;
    discountProperties?: string[];
  };
}

export const sourceConverter: FirestoreDataConverter<Source> = {
  toFirestore: (
    value: WithFieldValue<Source>,
  ): WithFieldValue<DocumentData> => {
    return value;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Source => {
    return {
      ...(snapshot.data() as Source),
      id: snapshot.id,
    };
  },
};
