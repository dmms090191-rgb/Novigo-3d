export interface User {
  id: string;
  email: string;
  type: 'admin' | 'lead';
  nom?: string;
  prenom?: string;
  telephone?: string;
  dateCreation?: string;
}