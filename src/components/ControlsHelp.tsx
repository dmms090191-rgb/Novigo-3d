import React from 'react';
import { Keyboard, Mouse, Navigation, Move, Grid3x3, Ruler, AlertCircle } from 'lucide-react';

const ControlsHelp: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto bg-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
            <Keyboard className="w-7 h-7" />
            Guide Complet du Logiciel
          </h2>
          <p className="text-cyan-100">
            Documentation complète : conventions de grille, contrôles 2D et 3D
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl border-2 border-orange-400 overflow-hidden">
          <div className="px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Convention de Grille Métrique
            </h3>
          </div>
          <div className="bg-slate-900/50 p-6 space-y-4">
            <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-cyan-400">
              <h4 className="text-lg font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <Grid3x3 className="w-5 h-5" />
                Système à Deux Niveaux
              </h4>
              <div className="space-y-3">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cyan-300 font-bold">Grand Carreau</span>
                    <span className="text-2xl font-bold text-cyan-400">1 mètre</span>
                  </div>
                  <p className="text-slate-300 text-sm">Lignes épaisses - Unité principale de mesure</p>
                  <p className="text-slate-400 text-xs mt-1">Dimensions : 1 m × 1 m</p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 font-bold">Petit Carreau</span>
                    <span className="text-2xl font-bold text-blue-400">10 cm</span>
                  </div>
                  <p className="text-slate-300 text-sm">Lignes fines - Précision de construction</p>
                  <p className="text-slate-400 text-xs mt-1">Dimensions : 0,1 m × 0,1 m</p>
                </div>
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg p-3 border border-cyan-500/30">
                  <p className="text-white font-bold text-center">
                    1 grand carreau = 10 × 10 petits carreaux
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-green-400">
              <h4 className="text-lg font-bold text-green-400 mb-3 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Exemples de Dimensions Standards
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-green-300 font-bold mb-1">Mur Intérieur</div>
                  <div className="text-white text-lg">10 cm</div>
                  <div className="text-slate-400 text-xs">= 1 petit carreau</div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-green-300 font-bold mb-1">Mur Extérieur</div>
                  <div className="text-white text-lg">20 cm</div>
                  <div className="text-slate-400 text-xs">= 2 petits carreaux</div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-green-300 font-bold mb-1">Porte Standard</div>
                  <div className="text-white text-lg">90 cm</div>
                  <div className="text-slate-400 text-xs">= 9 petits carreaux</div>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <div className="text-green-300 font-bold mb-1">Pièce de 4m</div>
                  <div className="text-white text-lg">4 mètres</div>
                  <div className="text-slate-400 text-xs">= 4 grands carreaux</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/30">
              <p className="text-yellow-200 text-sm">
                <span className="font-bold">Important :</span> Les grilles 2D et 3D sont parfaitement synchronisées.
                Les éléments s'alignent automatiquement sur la petite grille pour garantir une précision de 10 cm.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-750 border-b border-slate-700 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Navigation className="w-6 h-6 text-cyan-400" />
              Éditeur 3D - Mode Navigation
            </h3>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide">
                Déplacement FPS
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      W
                    </div>
                    <span className="text-slate-300">Avancer</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      S
                    </div>
                    <span className="text-slate-300">Reculer</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      A
                    </div>
                    <span className="text-slate-300">Gauche</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      D
                    </div>
                    <span className="text-slate-300">Droite</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      E
                    </div>
                    <span className="text-slate-300">Monter</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      Q
                    </div>
                    <span className="text-slate-300">Descendre</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-3 uppercase tracking-wide">
                Vues Rapides - Pavé Numérique
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      1
                    </div>
                    <span className="text-slate-300">Vue de face</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      3
                    </div>
                    <span className="text-slate-300">Vue de droite</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      7
                    </div>
                    <span className="text-slate-300">Vue du dessus</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Mouse className="w-4 h-4" />
                Contrôles Souris - Mode Déverrouillé
              </h4>
              <div className="space-y-2">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Mouse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-medium">Mouvement de la souris</div>
                      <div className="text-slate-500 text-sm">Regarder autour (mode FPS)</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Mouse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-medium">Molette</div>
                      <div className="text-slate-500 text-sm">Ajuster la vitesse de déplacement (0-10)</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center font-bold text-white">
                      ESC
                    </div>
                    <span className="text-slate-300">Quitter le mode FPS</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">
                Boutons Interface
              </h4>
              <div className="space-y-2">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bouton Soleil/Lune</span>
                    <span className="text-slate-500 text-sm">Basculer jour/nuit</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bouton Cadenas</span>
                    <span className="text-slate-500 text-sm">Verrouiller/déverrouiller pour navigation FPS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-750 border-b border-slate-700 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Move className="w-6 h-6 text-green-400" />
              Éditeur 3D - Mode Création
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-orange-500/10 rounded-lg p-4 border-l-4 border-orange-400">
              <h4 className="text-orange-300 font-bold mb-2">IMPORTANT - Activation</h4>
              <p className="text-slate-300 text-sm">
                Pour commencer à utiliser la zone 3D, appuyez sur le bouton <span className="px-2 py-1 bg-slate-700 rounded font-mono text-cyan-400">ON</span> pour activer la fenêtre.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide">
                Vues Rapides - Pavé Numérique
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      1
                    </div>
                    <span className="text-slate-300">Vue de face</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      3
                    </div>
                    <span className="text-slate-300">Vue de droite</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      7
                    </div>
                    <span className="text-slate-300">Vue du dessus</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Mouse className="w-4 h-4" />
                Contrôles Souris - Mode Verrouillé
              </h4>
              <div className="space-y-2">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Mouse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-medium">Clic gauche</div>
                      <div className="text-slate-500 text-sm">Créer ou modifier des blocs sur la grille</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Mouse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-medium">Molette</div>
                      <div className="text-slate-500 text-sm">Zoomer / Dézoomer la vue</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">
                Boutons Interface
              </h4>
              <div className="space-y-2">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bouton Soleil/Lune</span>
                    <span className="text-slate-500 text-sm">Basculer jour/nuit</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bouton Cadenas</span>
                    <span className="text-slate-500 text-sm">Verrouiller/déverrouiller la vue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-750 border-b border-slate-700 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-blue-400" />
              Éditeur 2D - Vue du Dessus
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-orange-500/10 rounded-lg p-4 border-l-4 border-orange-400">
              <h4 className="text-orange-300 font-bold mb-2">IMPORTANT - Démarrage</h4>
              <p className="text-slate-300 text-sm mb-3">
                Par défaut, la zone 2D démarre en <span className="font-bold text-cyan-400">vue du dessus (touche 7)</span>.
                Pour commencer à travailler :
              </p>
              <ol className="space-y-2 text-slate-300 text-sm ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">1.</span>
                  <span>Appuyez sur <span className="px-2 py-1 bg-slate-700 rounded font-mono text-cyan-400">ON</span> pour activer la fenêtre</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400 font-bold">2.</span>
                  <span>La vue est verrouillée par défaut en mode construction</span>
                </li>
              </ol>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wide">
                Vues Rapides - Pavé Numérique
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      1
                    </div>
                    <span className="text-slate-300">Vue de face</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      3
                    </div>
                    <span className="text-slate-300">Vue de droite</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-cyan-500 border-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                      7
                    </div>
                    <div>
                      <div className="text-cyan-300 font-bold">Vue du dessus</div>
                      <div className="text-xs text-cyan-400">Par défaut</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-3 uppercase tracking-wide flex items-center gap-2">
                <Mouse className="w-4 h-4" />
                Contrôles Souris
              </h4>
              <div className="space-y-2">
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Mouse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-medium">Survol + Clic gauche</div>
                      <div className="text-slate-500 text-sm">Placer un bloc sur la grille (mode verrouillé)</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Mouse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-medium">Clic droit sur un bloc</div>
                      <div className="text-slate-500 text-sm">Supprimer le bloc</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Mouse className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-slate-300 font-medium">Molette</div>
                      <div className="text-slate-500 text-sm">Zoomer / Dézoomer</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-wide">
                Boutons Interface
              </h4>
              <div className="space-y-2">
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bouton Soleil/Lune</span>
                    <span className="text-slate-500 text-sm">Basculer jour/nuit</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Bouton Cadenas</span>
                    <span className="text-slate-500 text-sm">Verrouiller/déverrouiller la vue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-5 text-white">
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Résumé Rapide
          </h3>
          <div className="space-y-3 text-sm text-cyan-50">
            <div className="flex items-start gap-2">
              <span className="text-cyan-300 font-bold flex-shrink-0">1.</span>
              <p><span className="font-bold">Activez la fenêtre</span> avec le bouton ON (cercle vert/rouge en haut à droite)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-300 font-bold flex-shrink-0">2.</span>
              <p><span className="font-bold">Zone 2D</span> : Démarre en vue du dessus (touche 7). Mode verrouillé par défaut pour dessiner.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-300 font-bold flex-shrink-0">3.</span>
              <p><span className="font-bold">Zone 3D</span> : Utilisez les touches 1, 3, 7 pour changer de vue. Déverrouillez pour naviguer en mode FPS.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-300 font-bold flex-shrink-0">4.</span>
              <p><span className="font-bold">Grille métrique</span> : Grands carreaux = 1m, petits carreaux = 10cm. Tout s'aligne automatiquement.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-cyan-300 font-bold flex-shrink-0">5.</span>
              <p><span className="font-bold">Cadenas</span> : Verrouillé = mode construction. Déverrouillé = mode navigation libre.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-bold text-white mb-3">Workflow Recommandé</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
              <p className="text-slate-300 text-sm">Dessinez votre plan en <span className="text-cyan-400 font-bold">Zone 2D</span> (vue du dessus)</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
              <p className="text-slate-300 text-sm">Visualisez le résultat en <span className="text-blue-400 font-bold">Zone 3D</span> en temps réel</p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">3</div>
              <p className="text-slate-300 text-sm">Ajustez les <span className="text-green-400 font-bold">paramètres</span> dans le panneau de droite</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlsHelp;
