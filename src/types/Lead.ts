export interface Lead {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  dateCreation: string;
  creePar?: string;
  sellerId?: string;
  sellerName?: string;
  status_id?: string;
  status?: {
    id: string;
    name: string;
    color: string;
  };
}