export interface Seller {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  dateCreation: string;
  isOnline?: boolean;
  lastConnection?: string;
}
