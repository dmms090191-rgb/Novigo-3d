import React from 'react';
import { ArrowLeft, Building, Leaf, Users, Award, MapPin, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuiSommesNous: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center py-2">
            <img
              src="/LOGO_OFFICIEL4096.png"
              alt="SJ Renov Pro"
              className="h-40 md:h-48 w-auto mb-2"
            />
            <Link to="/" className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 font-semibold transition-all duration-200 hover:scale-105 text-lg">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour à l'accueil</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="pt-[260px] md:pt-[280px] pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg">
              <Building className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Qui sommes-nous</h1>
            <p className="text-2xl text-emerald-600 font-semibold">SJRenov Pro – Votre partenaire en performance énergétique</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-12">
            <p className="text-lg text-gray-700 leading-relaxed">
              Créée en <span className="font-semibold text-emerald-600">2020</span>, SJRenov Pro est une entreprise française spécialisée dans la rénovation énergétique des bâtiments tertiaires, résidentiels et industriels.
              Basée à <span className="font-semibold text-emerald-600">Villeurbanne (Rhône)</span>, notre mission est d'accompagner les entreprises et les collectivités dans leur transition vers une efficacité énergétique durable, tout en optimisant leurs financements grâce aux Certificats d'Économies d'Énergie (CEE).
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Notre expertise</h2>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Forts de notre savoir-faire technique et de notre connaissance approfondie du dispositif CEE, nous proposons des solutions globales :
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Audit et étude énergétique complète</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Planification stratégique et conception sur mesure</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Pilotage et suivi des travaux</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Gestion administrative et financière des dossiers CEE</span>
                </li>
              </ul>
              <p className="text-gray-600 mt-6 italic">
                Nos équipes assurent un accompagnement de bout en bout, de l'analyse initiale à la livraison du chantier, en garantissant conformité, performance et transparence.
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-3xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Nos secteurs d'intervention</h2>
              </div>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Nous intervenons sur l'ensemble du territoire français dans trois grands domaines :
              </p>
              <div className="space-y-6">
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-amber-600 text-lg mb-2">🏢 Tertiaire</h3>
                  <p className="text-gray-600">Bureaux, établissements scolaires, commerces, santé</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-emerald-600 text-lg mb-2">🏠 Résidentiel collectif</h3>
                  <p className="text-gray-600">Copropriétés, bailleurs sociaux, foncières</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold text-sky-600 text-lg mb-2">🏭 Industrie</h3>
                  <p className="text-gray-600">Entrepôts, usines, sites logistiques</p>
                </div>
              </div>
              <p className="text-gray-600 mt-6 italic">
                Chaque secteur bénéficie de solutions adaptées, respectueuses des normes environnementales et éligibles aux financements CEE.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 md:p-12 shadow-lg mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Nos partenaires de confiance</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">
              Nous collaborons avec des acteurs majeurs tels que :
            </p>
            <div className="flex flex-wrap gap-4 mb-6">
              <span className="bg-white px-6 py-3 rounded-full font-semibold text-emerald-700 shadow-md">Foncia</span>
              <span className="bg-white px-6 py-3 rounded-full font-semibold text-emerald-700 shadow-md">Valority</span>
              <span className="bg-white px-6 py-3 rounded-full font-semibold text-emerald-700 shadow-md">Les Belles Années</span>
              <span className="bg-white px-6 py-3 rounded-full font-semibold text-emerald-700 shadow-md">Groupe Evotion</span>
              <span className="bg-white px-6 py-3 rounded-full font-semibold text-emerald-700 shadow-md">Régie des Lumières</span>
              <span className="bg-white px-6 py-3 rounded-full font-semibold text-emerald-700 shadow-md">Enerly Eco</span>
            </div>
            <p className="text-gray-600 italic">
              Ces partenariats témoignent de la crédibilité et de la solidité de SJRenov Pro sur le marché de la rénovation énergétique.
            </p>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-8 md:p-12 shadow-lg mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <Award className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Notre vision</h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              Chez SJRenov Pro, nous croyons qu'une entreprise performante est avant tout responsable et durable.
              Notre ambition : <span className="font-semibold text-emerald-600">réinventer l'avenir énergétique des bâtiments français</span>, réduire leur empreinte carbone et offrir à nos clients un confort optimal tout en maîtrisant leurs dépenses.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-2 border-emerald-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shadow-md">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Informations légales</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-900">Raison sociale :</span> SJRenov Pro</p>
                <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-900">Forme juridique :</span> SARL</p>
                <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-900">SIREN :</span> 881 522 015</p>
                <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-900">Numéro de TVA :</span> FR 58 881 522 015</p>
              </div>
              <div>
                <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-900">Adresse :</span> 9 Rue Docteur Ollier, 69100 Villeurbanne</p>
                <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-900">Dirigeant :</span> Samuel Azoulay</p>
                <p className="text-gray-600 mb-2"><span className="font-semibold text-gray-900">Activité (NAF) :</span> 4619B – Autres intermédiaires du commerce en produits divers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuiSommesNous;
