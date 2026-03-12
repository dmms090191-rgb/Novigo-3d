import React from 'react';
import { ArrowLeft, Factory, Gauge, Leaf, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecteurIndustriel: React.FC = () => {
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-500 rounded-2xl mb-6">
              <Factory className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Secteur Industriel</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Systèmes énergétiques performants pour réduire l'empreinte carbone et les coûts énergétiques de votre industrie tout en augmentant votre compétitivité.
            </p>
          </div>

          <section className="mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Solutions Industrielles sur Mesure</h2>
                <p className="text-lg text-gray-600 mb-8">
                  Nous concevons et installons des systèmes énergétiques adaptés aux contraintes spécifiques de l'industrie, avec un focus sur la performance et la rentabilité.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Centrales solaires industrielles</h3>
                      <p className="text-gray-600">Installations photovoltaïques à grande échelle pour vos toitures et terrains</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Cogénération et récupération d'énergie</h3>
                      <p className="text-gray-600">Valorisez la chaleur fatale de vos processus industriels</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Optimisation énergétique des process</h3>
                      <p className="text-gray-600">Audit et amélioration de la performance énergétique de vos équipements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Systèmes de gestion énergétique</h3>
                      <p className="text-gray-600">Monitoring et pilotage intelligent de vos consommations</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                    alt="Site industriel"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Avantages compétitifs</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-8 border border-sky-100">
                <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <Gauge className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Performance optimale</h3>
                <p className="text-gray-600">
                  Maximisez l'efficacité énergétique de vos installations industrielles avec nos solutions techniques avancées.
                </p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-8 border border-emerald-100">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mb-6">
                  <Leaf className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Engagement environnemental</h3>
                <p className="text-gray-600">
                  Réduisez significativement votre empreinte carbone et démontrez votre responsabilité écologique.
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-8 border border-amber-100">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Accompagnement complet</h3>
                <p className="text-gray-600">
                  De l'audit initial à la maintenance, nous vous accompagnons sur le long terme pour garantir vos résultats.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Optimisez votre industrie dès maintenant</h2>
            <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
              Contactez nos experts pour un audit énergétique de votre site industriel et découvrez le potentiel d'économies et d'optimisation de vos installations.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-all shadow-lg"
            >
              Demander un audit gratuit
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SecteurIndustriel;
