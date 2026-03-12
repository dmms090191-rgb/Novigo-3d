import React from 'react';
import { ArrowLeft, Home, Sun, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecteurResidentiel: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl mb-6">
              <Home className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Secteur Résidentiel</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transformez votre maison en un espace éco-responsable avec nos solutions de rénovation énergétique personnalisées et économiques.
            </p>
          </div>

          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                    alt="Maison moderne"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Nos Solutions pour votre Maison</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Nous vous accompagnons dans tous vos projets de rénovation énergétique pour améliorer le confort de votre logement tout en réduisant vos factures.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Panneaux solaires photovoltaïques</h3>
                      <p className="text-gray-600">Produisez votre propre électricité verte et faites des économies</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Pompes à chaleur</h3>
                      <p className="text-gray-600">Chauffage et climatisation performants pour un confort optimal</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Isolation thermique</h3>
                      <p className="text-gray-600">Réduisez vos pertes de chaleur et gagnez en confort</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Chauffe-eau solaire</h3>
                      <p className="text-gray-600">Eau chaude sanitaire gratuite grâce à l'énergie solaire</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Pourquoi choisir l'énergie verte ?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border border-amber-100">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <Sun className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Économies durables</h3>
                <p className="text-gray-600">
                  Réduisez vos factures d'énergie jusqu'à 70% et rentabilisez votre investissement rapidement.
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 border border-emerald-100">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                  <Home className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Confort amélioré</h3>
                <p className="text-gray-600">
                  Profitez d'une température agréable toute l'année et d'un environnement sain.
                </p>
              </div>
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-8 border border-sky-100">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Valorisation du bien</h3>
                <p className="text-gray-600">
                  Augmentez la valeur de votre propriété avec un meilleur diagnostic énergétique.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Prêt à rénover votre maison ?</h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Bénéficiez d'un diagnostic gratuit et découvrez toutes les aides financières disponibles pour votre projet de rénovation énergétique.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-all shadow-lg"
            >
              Demander un devis gratuit
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SecteurResidentiel;
