import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Dashboard from './components/Dashboard';
import ClientLogin from './components/ClientLogin';
import ClientDashboard from './components/ClientDashboard';
import SellerLogin from './components/SellerLogin';
import SellerDashboard from './components/SellerDashboard';
import AdminLogin from './components/AdminLogin';
import SecteurTertiaire from './pages/SecteurTertiaire';
import SecteurResidentiel from './pages/SecteurResidentiel';
import SecteurIndustriel from './pages/SecteurIndustriel';
import QuiSommesNous from './pages/QuiSommesNous';
import Plan from './pages/Plan';
import { User } from './types/User';
import { Lead } from './types/Lead';
import { Registration } from './types/Registration';
import { Seller } from './types/Seller';
import { Admin } from './types/Admin';
import { leadService } from './services/leadService';
import { adminService } from './services/adminService';
import { sellerService } from './services/sellerService';
import { clientService } from './services/clientService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const stored = sessionStorage.getItem('isAdminLoggedIn');
    return stored === 'true';
  });
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [leads, setLeads] = useState<Lead[]>(() => {
    const savedLeads = localStorage.getItem('leads');
    return savedLeads ? JSON.parse(savedLeads) : [];
  });
  const [bulkLeads, setBulkLeads] = useState<Lead[]>(() => {
    const savedBulkLeads = localStorage.getItem('bulkLeads');
    return savedBulkLeads ? JSON.parse(savedBulkLeads) : [];
  });
  const [transferredLeads, setTransferredLeads] = useState<Lead[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    const savedRegistrations = localStorage.getItem('global_registrations');
    return savedRegistrations ? JSON.parse(savedRegistrations) : [];
  });
  const [sellers, setSellers] = useState<Seller[]>(() => {
    const savedSellers = localStorage.getItem('sellers');
    return savedSellers ? JSON.parse(savedSellers) : [];
  });
  const [admins, setAdmins] = useState<Admin[]>(() => {
    const savedAdmins = localStorage.getItem('admins');
    return savedAdmins ? JSON.parse(savedAdmins) : [];
  });
  const [homepageImage, setHomepageImage] = useState<string | null>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [isAdminViewingClient, setIsAdminViewingClient] = useState(false);
  const [sellerData, setSellerData] = useState<Seller | null>(() => {
    const stored = sessionStorage.getItem('sellerData');
    return stored ? JSON.parse(stored) : null;
  });

  const getUserKey = () => {
    if (user?.type === 'admin') return `admin_${user.id}`;
    if (sellerData) return `seller_${sellerData.id}`;
    return 'default';
  };

  useEffect(() => {
    const storedClientData = sessionStorage.getItem('clientData');
    const storedIsAdminViewing = sessionStorage.getItem('isAdminViewingClient');
    if (storedClientData) {
      try {
        setClientData(JSON.parse(storedClientData));
        if (storedIsAdminViewing === 'true') {
          setIsAdminViewingClient(true);
        }
      } catch (e) {
        console.error('Erreur parsing clientData:', e);
        sessionStorage.removeItem('clientData');
        sessionStorage.removeItem('isAdminViewingClient');
      }
    }

    const loadDataFromSupabase = async () => {
      try {
        const [leadsData, adminsData, sellersData, clientsData] = await Promise.all([
          leadService.getAllLeads(),
          adminService.getAllAdmins(),
          sellerService.getAllSellers(),
          clientService.getAllClients()
        ]);

        const formattedLeads = leadsData.map((lead: any) => ({
          id: String(lead.id),
          nom: lead.full_name?.split(' ').pop() || '',
          prenom: lead.full_name?.split(' ')[0] || '',
          email: lead.email,
          motDePasse: '',
          telephone: lead.phone || '',
          dateCreation: new Date(lead.created_at).toLocaleString('fr-FR'),
          creePar: lead.notes?.includes('par') ? lead.notes.split('par ')[1] : 'Admin'
        }));
        setLeads(formattedLeads);

        const formattedAdmins = adminsData.map((admin: any) => ({
          id: admin.id,
          nom: admin.full_name?.split(' ').pop() || '',
          prenom: admin.full_name?.split(' ')[0] || '',
          email: admin.email,
          motDePasse: '',
          dateCreation: new Date(admin.created_at).toLocaleString('fr-FR')
        }));
        setAdmins(formattedAdmins);

        const formattedSellers = sellersData.map((seller: any) => ({
          id: seller.id,
          nom: seller.full_name?.split(' ').pop() || '',
          prenom: seller.full_name?.split(' ')[0] || '',
          email: seller.email,
          motDePasse: '',
          dateCreation: new Date(seller.created_at).toLocaleString('fr-FR')
        }));
        setSellers(formattedSellers);

        const formattedClients = clientsData.map((client: any) => ({
          id: client.id,
          nom: client.full_name?.split(' ').pop() || '',
          prenom: client.full_name?.split(' ')[0] || '',
          email: client.email,
          motDePasse: '',
          telephone: client.phone || '',
          dateCreation: new Date(client.created_at).toLocaleString('fr-FR'),
          dateInscription: new Date(client.created_at).toLocaleString('fr-FR'),
          agentAssigne: client.assigned_agent_name,
          status_id: client.status_id,
          status: client.status
        }));
        setRegistrations(formattedClients);
        setTransferredLeads(formattedClients);

        console.log('✅ Données chargées depuis Supabase');
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    loadDataFromSupabase();
  }, []);

  useEffect(() => {
    const userKey = getUserKey();
    const savedLeads = localStorage.getItem(`leads_${userKey}`);
    setLeads(savedLeads ? JSON.parse(savedLeads) : []);
  }, [user, sellerData]);

  useEffect(() => {
    const userKey = getUserKey();
    if (userKey !== 'default') {
      localStorage.setItem(`leads_${userKey}`, JSON.stringify(leads));
    }
  }, [leads, user, sellerData]);

  useEffect(() => {
    localStorage.setItem('leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('bulkLeads', JSON.stringify(bulkLeads));
  }, [bulkLeads]);


  useEffect(() => {
    localStorage.setItem('global_registrations', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('sellers', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem('admins', JSON.stringify(admins));
  }, [admins]);


  const handleLogin = (email: string, password: string) => {
    const sellerIndex = sellers.findIndex(
      s => s.email === email && s.motDePasse === password
    );

    if (sellerIndex !== -1) {
      const updatedSeller = {
        ...sellers[sellerIndex],
        isOnline: true,
        lastConnection: new Date().toISOString()
      };
      const updatedSellers = [...sellers];
      updatedSellers[sellerIndex] = updatedSeller;
      setSellers(updatedSellers);
      setSellerData(updatedSeller);
      sessionStorage.setItem('sellerData', JSON.stringify(updatedSeller));
      return true;
    }

    const adminIndex = admins.findIndex(
      a => a.email === email && a.motDePasse === password
    );

    if (adminIndex !== -1) {
      const updatedAdmin = {
        ...admins[adminIndex],
        isOnline: true,
        lastConnection: new Date().toISOString()
      };
      const updatedAdmins = [...admins];
      updatedAdmins[adminIndex] = updatedAdmin;
      setAdmins(updatedAdmins);
      const adminUser = {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        type: 'admin' as const
      };
      setIsLoggedIn(true);
      setUser(adminUser);
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      sessionStorage.setItem('adminUser', JSON.stringify(adminUser));
      return true;
    }

    if (email === 'dmms090191@gmail.com' && password === '000000') {
      const adminUser = {
        id: 'super-admin',
        email,
        type: 'admin' as const
      };
      setIsLoggedIn(true);
      setUser(adminUser);
      sessionStorage.setItem('isAdminLoggedIn', 'true');
      sessionStorage.setItem('adminUser', JSON.stringify(adminUser));
      return true;
    }

    return false;
  };

  const handleLogout = () => {
    if (user) {
      const adminIndex = admins.findIndex(a => a.id === user.id);
      if (adminIndex !== -1) {
        const updatedAdmin = {
          ...admins[adminIndex],
          isOnline: false,
          lastConnection: new Date().toISOString()
        };
        const updatedAdmins = [...admins];
        updatedAdmins[adminIndex] = updatedAdmin;
        setAdmins(updatedAdmins);
      }
    }
    setIsLoggedIn(false);
    setUser(null);
    setLeads([]);
    setRegistrations([]);
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminUser');
  };

  const handleClientLogin = (data: any) => {
    setClientData(data);
    sessionStorage.setItem('clientData', JSON.stringify(data));
  };

  const handleAdminLoginAsClient = (lead: Lead) => {
    const clientData = {
      user: { id: lead.id, email: lead.email },
      token: 'admin-viewing-token',
      client: {
        id: lead.id,
        email: lead.email,
        full_name: `${lead.prenom} ${lead.nom}`,
        phone: lead.telephone,
        status: 'actif',
        created_at: lead.dateCreation || new Date().toISOString()
      }
    };
    setClientData(clientData);
    setIsAdminViewingClient(true);
    sessionStorage.setItem('clientData', JSON.stringify(clientData));
    sessionStorage.setItem('isAdminViewingClient', 'true');
    window.location.href = '/client/dashboard';
  };

  const handleReturnToAdmin = () => {
    setClientData(null);
    setIsAdminViewingClient(false);
    sessionStorage.removeItem('clientData');
    sessionStorage.removeItem('isAdminViewingClient');
    window.location.href = '/';
  };

  const handleAdminLoginAsSeller = (seller: Seller) => {
    const sellerData = {
      ...seller,
      isAdminViewing: true
    };
    setSellerData(sellerData);
    sessionStorage.setItem('sellerData', JSON.stringify(sellerData));
    sessionStorage.setItem('isAdminViewingSeller', 'true');
    window.location.href = '/seller/dashboard';
  };

  const handleReturnToAdminFromSeller = () => {
    setSellerData(null);
    sessionStorage.removeItem('sellerData');
    sessionStorage.removeItem('isAdminViewingSeller');
    window.location.href = '/';
  };

  const handleClientLogout = () => {
    setClientData(null);
    sessionStorage.removeItem('clientData');
    window.location.href = '/';
  };

  const handleSellerLogin = (seller: Seller) => {
    setSellerData(seller);
    sessionStorage.setItem('sellerData', JSON.stringify(seller));
  };

  const handleSellerLogout = () => {
    if (sellerData) {
      const sellerIndex = sellers.findIndex(s => s.id === sellerData.id);
      if (sellerIndex !== -1) {
        const updatedSeller = {
          ...sellers[sellerIndex],
          isOnline: false,
          lastConnection: new Date().toISOString()
        };
        const updatedSellers = [...sellers];
        updatedSellers[sellerIndex] = updatedSeller;
        setSellers(updatedSellers);
      }
    }
    setSellerData(null);
    sessionStorage.removeItem('sellerData');
    setLeads([]);
    setRegistrations([]);
    window.location.href = '/';
  };

  const handleLeadCreated = (newLead: Lead) => {
    setLeads(prev => [...prev, newLead]);
  };

  const handleBulkLeadCreated = (newLead: Lead) => {
    setBulkLeads(prev => [...prev, newLead]);
  };

  const handleLeadsDeleted = async (leadIds: string[]) => {
    console.log('🔄 [App] handleLeadsDeleted appelé avec:', leadIds);
    setLeads(prev => prev.filter(lead => !leadIds.includes(lead.id)));

    try {
      const leadsData = await leadService.getAllLeads();
      const formattedLeads = leadsData.map((lead: any) => ({
        id: String(lead.id),
        nom: lead.full_name?.split(' ').pop() || '',
        prenom: lead.full_name?.split(' ')[0] || '',
        email: lead.email,
        motDePasse: '',
        telephone: lead.phone || '',
        dateCreation: new Date(lead.created_at).toLocaleString('fr-FR'),
        creePar: lead.notes?.includes('par') ? lead.notes.split('par ')[1] : 'Admin'
      }));
      console.log('✅ [App] Leads rechargés depuis Supabase:', formattedLeads.length);
      setLeads(formattedLeads);
    } catch (error) {
      console.error('❌ [App] Erreur lors du rechargement des leads:', error);
    }
  };

  const handleBulkLeadsDeleted = (leadIds: string[]) => {
    setBulkLeads(prev => prev.filter(lead => !leadIds.includes(lead.id)));
  };

  const handleBulkLeadsTransferred = async (leadIds: string[]) => {
    console.log('🔄 [BULK TRANSFER] Début du transfert pour:', leadIds);
    const leadsToTransfer = bulkLeads.filter(lead => leadIds.includes(lead.id));
    console.log('🔄 [BULK TRANSFER] Leads à transférer:', leadsToTransfer);

    const createdClients = [];
    for (const lead of leadsToTransfer) {
      try {
        console.log('🔄 [BULK TRANSFER] Création du client:', lead.email);
        const client = await clientService.createClient({
          email: lead.email,
          full_name: `${lead.prenom} ${lead.nom}`,
          phone: lead.telephone || '',
        });
        createdClients.push(client);
        console.log('✅ [BULK TRANSFER] Client créé:', client);
      } catch (error) {
        console.error('❌ [BULK TRANSFER] Erreur création client:', error);
        throw error;
      }
    }

    console.log('🔄 [BULK TRANSFER] Rechargement des clients...');
    const [clientsData] = await Promise.all([clientService.getAllClients()]);
    const formattedClients = clientsData.map((client: any) => ({
      id: client.id,
      nom: client.full_name?.split(' ').pop() || '',
      prenom: client.full_name?.split(' ')[0] || '',
      email: client.email,
      motDePasse: '',
      telephone: client.phone || '',
      dateCreation: new Date(client.created_at).toLocaleString('fr-FR'),
      dateInscription: new Date(client.created_at).toLocaleString('fr-FR'),
      agentAssigne: client.assigned_agent_name,
      status_id: client.status_id,
      status: client.status
    }));
    setTransferredLeads(formattedClients);
    setBulkLeads(prev => prev.filter(lead => !leadIds.includes(lead.id)));
    console.log('✅ [BULK TRANSFER] Transfert terminé avec succès');
  };

  const handleLeadsTransferred = async (leadIds: string[]) => {
    console.log('🔄 [LEADS TRANSFER] Début du transfert pour:', leadIds);
    const leadsToTransfer = leads.filter(lead => leadIds.includes(lead.id));
    console.log('🔄 [LEADS TRANSFER] Leads à transférer:', leadsToTransfer);

    const createdClients = [];
    for (const lead of leadsToTransfer) {
      try {
        console.log('🔄 [LEADS TRANSFER] Création du client:', lead.email);
        const client = await clientService.createClient({
          email: lead.email,
          full_name: `${lead.prenom} ${lead.nom}`,
          phone: lead.telephone || '',
        });
        createdClients.push(client);
        console.log('✅ [LEADS TRANSFER] Client créé:', client);
      } catch (error) {
        console.error('❌ [LEADS TRANSFER] Erreur création client:', error);
        throw error;
      }
    }

    console.log('🔄 [LEADS TRANSFER] Suppression des leads de la table leads...');
    for (const leadId of leadIds) {
      try {
        await leadService.deleteLead(leadId);
        console.log('✅ [LEADS TRANSFER] Lead supprimé:', leadId);
      } catch (error) {
        console.error('❌ [LEADS TRANSFER] Erreur suppression lead:', error);
      }
    }

    console.log('🔄 [LEADS TRANSFER] Rechargement des clients...');
    const [clientsData] = await Promise.all([clientService.getAllClients()]);
    const formattedClients = clientsData.map((client: any) => ({
      id: client.id,
      nom: client.full_name?.split(' ').pop() || '',
      prenom: client.full_name?.split(' ')[0] || '',
      email: client.email,
      motDePasse: '',
      telephone: client.phone || '',
      dateCreation: new Date(client.created_at).toLocaleString('fr-FR'),
      dateInscription: new Date(client.created_at).toLocaleString('fr-FR'),
      agentAssigne: client.assigned_agent_name,
      status_id: client.status_id,
      status: client.status
    }));
    setTransferredLeads(formattedClients);
    setLeads(prev => prev.filter(lead => !leadIds.includes(lead.id)));
    console.log('✅ [LEADS TRANSFER] Transfert terminé avec succès');
  };

  const handleTransferredLeadsDeleted = async (clientIds: string[]) => {
    try {
      for (const id of clientIds) {
        await clientService.deleteClient(id);
      }
      const [clientsData] = await Promise.all([clientService.getAllClients()]);
      const formattedClients = clientsData.map((client: any) => ({
        id: client.id,
        nom: client.full_name?.split(' ').pop() || '',
        prenom: client.full_name?.split(' ')[0] || '',
        email: client.email,
        motDePasse: '',
        telephone: client.phone || '',
        dateCreation: new Date(client.created_at).toLocaleString('fr-FR'),
        dateInscription: new Date(client.created_at).toLocaleString('fr-FR'),
        agentAssigne: client.assigned_agent_name,
        status_id: client.status_id,
        status: client.status
      }));
      setTransferredLeads(formattedClients);
    } catch (error) {
      console.error('Error deleting clients:', error);
      throw error;
    }
  };

  const handleHomepageImageUpdate = (imageUrl: string | null) => {
    setHomepageImage(imageUrl);
  };

  const handleRegister = (registration: Registration) => {
    setRegistrations(prev => [...prev, registration]);
  };

  const handleApproveRegistration = (id: string) => {
    const registration = registrations.find(reg => reg.id === id);
    if (registration) {
      const newLead: Lead = {
        id: registration.id,
        nom: registration.nom,
        prenom: registration.prenom,
        email: registration.email,
        motDePasse: registration.motDePasse,
        telephone: registration.telephone,
        dateCreation: registration.dateInscription
      };

      setTransferredLeads(prev => [...prev, newLead]);
      setRegistrations(prev => prev.filter(reg => reg.id !== id));
    }
  };

  const handleRejectRegistration = (id: string) => {
    setRegistrations(prev => prev.filter(reg => reg.id !== id));
  };

  const handleRestoreLeads = (restoredLeads: Lead[]) => {
    setLeads(restoredLeads);
  };

  const handleRestoreRegistrations = (restoredRegistrations: Registration[]) => {
    setRegistrations(restoredRegistrations);
  };

  const handleSellerCreated = (newSeller: Seller) => {
    setSellers(prev => [...prev, newSeller]);
  };

  const handleSellersDeleted = (sellerIds: string[]) => {
    setSellers(prev => prev.filter(seller => !sellerIds.includes(seller.id)));
  };

  const handleAdminCreated = (newAdmin: Admin) => {
    setAdmins(prev => [...prev, newAdmin]);
  };

  const handleAdminsDeleted = (adminIds: string[]) => {
    setAdmins(prev => prev.filter(admin => !adminIds.includes(admin.id)));
  };

  const handleStatusChanged = (leadId: string, statusId: string | null) => {
    setTransferredLeads(prev => prev.map(lead => {
      if (lead.id === leadId) {
        return { ...lead, status_id: statusId, status: statusId || 'nouveau' };
      }
      return lead;
    }));
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/secteurs/tertiaire" element={<SecteurTertiaire />} />
          <Route path="/secteurs/residentiel" element={<SecteurResidentiel />} />
          <Route path="/secteurs/industriel" element={<SecteurIndustriel />} />
          <Route path="/qui-sommes-nous" element={<QuiSommesNous />} />
          <Route path="/plan" element={<Plan />} />

          <Route
            path="/client-login"
            element={
              clientData ? (
                <Navigate to="/client/dashboard" replace />
              ) : (
                <ClientLogin onLoginSuccess={handleClientLogin} />
              )
            }
          />

          <Route
            path="/client/dashboard"
            element={
              (() => {
                const storedData = sessionStorage.getItem('clientData');
                const data = clientData || (storedData ? JSON.parse(storedData) : null);
                return data ? (
                  <ClientDashboard
                    clientData={data}
                    onLogout={handleClientLogout}
                    isAdminViewing={isAdminViewingClient}
                    onReturnToAdmin={handleReturnToAdmin}
                  />
                ) : (
                  <Navigate to="/client-login" replace />
                );
              })()
            }
          />

          <Route
            path="/seller-login"
            element={
              sellerData ? (
                <Navigate to="/seller/dashboard" replace />
              ) : (
                <SellerLogin sellers={sellers} onLoginSuccess={handleSellerLogin} />
              )
            }
          />

          <Route
            path="/seller/dashboard"
            element={
              (() => {
                const storedData = sessionStorage.getItem('sellerData');
                const data = sellerData || (storedData ? JSON.parse(storedData) : null);
                const isAdminViewing = sessionStorage.getItem('isAdminViewingSeller') === 'true';
                return data ? (
                  <SellerDashboard
                    sellerData={data}
                    onLogout={handleSellerLogout}
                    leads={leads}
                    onLeadCreated={handleLeadCreated}
                    onLeadsDeleted={handleLeadsDeleted}
                    onLeadsTransferred={handleLeadsTransferred}
                    transferredLeads={transferredLeads}
                    onReturnToAdmin={isAdminViewing ? handleReturnToAdminFromSeller : undefined}
                  />
                ) : (
                  <Navigate to="/seller-login" replace />
                );
              })()
            }
          />

          <Route
            path="/admin-login"
            element={
              isLoggedIn && user?.type === 'admin' ? (
                <Navigate to="/" replace />
              ) : (
                <AdminLogin admins={admins} onLoginSuccess={handleLogin} />
              )
            }
          />

          <Route
            path="/"
            element={
              (() => {
                if (sellerData) {
                  return <Navigate to="/seller/dashboard" replace />;
                }
                if (isLoggedIn && user?.type === 'admin') {
                  return (
                    <Dashboard
                      user={user}
                      onLogout={handleLogout}
                      leads={leads}
                      onLeadCreated={handleLeadCreated}
                      onLeadsDeleted={handleLeadsDeleted}
                      onLeadsTransferred={handleLeadsTransferred}
                      transferredLeads={transferredLeads}
                      onTransferredLeadsDeleted={handleTransferredLeadsDeleted}
                      bulkLeads={bulkLeads}
                      onBulkLeadCreated={handleBulkLeadCreated}
                      onBulkLeadsDeleted={handleBulkLeadsDeleted}
                      onBulkLeadsTransferred={handleBulkLeadsTransferred}
                      homepageImage={homepageImage}
                      onHomepageImageUpdate={handleHomepageImageUpdate}
                      registrations={registrations}
                      onApproveRegistration={handleApproveRegistration}
                      onRejectRegistration={handleRejectRegistration}
                      onRestoreLeads={handleRestoreLeads}
                      onRestoreRegistrations={handleRestoreRegistrations}
                      sellers={sellers}
                      onSellerCreated={handleSellerCreated}
                      onSellersDeleted={handleSellersDeleted}
                      admins={admins}
                      onAdminCreated={handleAdminCreated}
                      onAdminsDeleted={handleAdminsDeleted}
                      onClientLogin={handleAdminLoginAsClient}
                      onSellerLogin={handleAdminLoginAsSeller}
                      onStatusChanged={handleStatusChanged}
                    />
                  );
                }
                return <HomePage onLogin={handleLogin} onRegister={handleRegister} />;
              })()
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;