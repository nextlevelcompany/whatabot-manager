import * as Icons from 'tabler-icons-react';
import HkBadge from '@/components/@hk-badge/@hk-badge';

export const SidebarMenu = [
    {
        group: '',
        contents: [
            {
                name: 'Dashboard',
                icon: <Icons.Template />,
                path: '/dashboard',
            },
            {
                name: 'Chat WhatsApp',
                icon: <Icons.MessageDots />,
                path: '/apps/chat/chats',
                badge: <HkBadge size="sm" bg="success" soft className="ms-auto" >Activo</HkBadge>
            },
        ]
    },
    {
        group: 'CRM & Ventas',
        contents: [
            {
                id: 'menu_contactos',
                name: 'Contactos',
                icon: <Icons.Notebook />,
                path: '/apps/contact/',
                childrens: [
                    {
                        name: 'Ver Contactos',
                        path: '/apps/contact/contact-list',
                    },
                    {
                        name: 'Crear Contactos',
                        path: '/apps/contact/edit-contact',
                    }
                ]
            },
            {
                id: 'menu_oportunidades',
                name: 'Oportunidades',
                icon: <Icons.UserSearch />,
                path: '/opportunities/',
                childrens: [
                    {
                        name: 'Ver Oportunidades',
                        path: '/opportunities/view',
                    },
                    {
                        name: 'Crear Oportunidades',
                        path: '/opportunities/create',
                    }
                ]
            },
            {
                id: 'menu_pedidos',
                name: 'Pedidos',
                icon: <Icons.FileCheck />,
                path: '/pedidos/',
                childrens: [
                    {
                        name: 'Ver Pedidos',
                        path: '/pedidos/view',
                    },
                    {
                        name: 'Crear Pedidos',
                        path: '/pedidos/create',
                    },
                    {
                        name: 'Reportes de Pedidos',
                        path: '/pedidos/reports',
                    },
                    {
                        name: 'Zonas de Entrega',
                        path: '/admin/zones',
                    },
                    {
                        name: 'Flota y Conductores',
                        path: '/admin/fleet',
                    }
                ]
            },
            {
                id: 'menu_ventas',
                name: 'Ventas',
                icon: <Icons.FileDigit />,
                path: '/ventas/',
                childrens: [
                    {
                        name: 'Ver Ventas',
                        path: '/ventas/view',
                    },
                    {
                        name: 'Crear Ventas',
                        path: '/ventas/create',
                    },
                    {
                        name: 'Reportes de Ventas',
                        path: '/ventas/reports',
                    }
                ]
            },
            {
                id: 'menu_productos',
                name: 'Productos',
                icon: <Icons.Layout />,
                path: '/productos/',
                childrens: [
                    {
                        name: 'Ver Productos',
                        path: '/productos/view',
                    },
                    {
                        name: 'Categorías',
                        path: '/productos/categorias',
                    }
                ]
            },
            {
                id: 'menu_inventarios',
                name: 'Inventarios',
                icon: <Icons.LayoutKanban />,
                path: '/inventarios/',
                childrens: [
                    {
                        name: 'Inventario Actual',
                        path: '/inventarios/current',
                    },
                    {
                        name: 'Compra Inventario',
                        path: '/inventarios/purchase',
                    }
                ]
            }
        ]
    },
    {
        group: 'Administración & Finanzas',
        contents: [
            {
                id: 'menu_finanzas',
                name: 'Finanzas',
                icon: <Icons.Inbox />,
                path: '/finanzas/',
                childrens: [
                    {
                        name: 'Movimientos de Caja',
                        path: '/finanzas/cash-flow',
                    },
                    {
                        name: 'Compras de Almacén',
                        path: '/finanzas/purchases',
                    },
                    {
                        name: 'Registro de Gastos',
                        path: '/finanzas/expenses',
                    },
                    {
                        name: 'Deudas Bancarias',
                        path: '/finanzas/debts',
                    },
                    {
                        name: 'Reportes Financieros',
                        path: '/finanzas/reports',
                    },
                    {
                        name: 'Proveedores',
                        path: '/finanzas/suppliers',
                    },
                    {
                        name: 'Gastos Recurrentes',
                        path: '/finanzas/recurring-expenses',
                    }
                ]
            },
            {
                id: 'menu_personal',
                name: 'Personal y Planilla',
                icon: <Icons.UserPlus />,
                path: '/payroll/',
                childrens: [
                    {
                        name: 'Gestión de Personal',
                        path: '/payroll/staff',
                    },
                    {
                        name: 'Asistencia Diaria',
                        path: '/payroll/attendance-daily',
                    },
                    {
                        name: 'Asistencia Mensual',
                        path: '/payroll/attendance-monthly',
                    },
                    {
                        name: 'Planilla y Comisiones',
                        path: '/payroll/commissions',
                    }
                ]
            },
            {
                id: 'menu_admin',
                name: 'Administración',
                icon: <Icons.FileCode2 />,
                path: '/admin/',
                childrens: [
                    {
                        name: 'Configuración',
                        path: '/admin/config',
                    },
                    {
                        name: 'Usuarios',
                        path: '/admin/users',
                    },
                    {
                        name: 'Roles y Permisos',
                        path: '/admin/roles',
                    },
                    {
                        name: 'Ajustes Generales',
                        path: '/admin/general-settings',
                    }
                ]
            }
        ]
    }
];
