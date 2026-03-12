export interface Registration {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  motDePasse: string;
  telephone: string;
  dateInscription: string;
  statut: 'en_attente' | 'valide' | 'refuse';
}