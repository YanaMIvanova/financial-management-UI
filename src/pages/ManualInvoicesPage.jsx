import { useState, useCallback } from 'react'
import { Container, Button } from 'react-bootstrap'
import { Helmet } from 'react-helmet-async'
import Papa from 'papaparse'
import { DateTime } from 'luxon'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/pro-light-svg-icons'

import { Grid, ManualInvoiceModal } from '../components'
import { useGetManualInvoicesQuery } from '../services/manual-invoices'
import { gridContextMenu, downloadCsvFile } from '../utils'

const deriveInvoiceNumber = ({ data }) =>
    `${data?.courseYear}${`${data?.user.cfNumber}`.padStart(2, '0')}${`${data?.invoiceNumberForCurrentYear}`.padStart(
        4,
        '0'
    )}`

export function ManualInvoicesPage() {
    const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false)
    const [selectedInvoiceId, setSelectedInvoiceId] = useState()

    const {
        data: invoicesData,
        isFetchingInvoices,
        refetch: refetchInvoices,
    } = useGetManualInvoicesQuery(null, { refetchOnMountOrArgChange: true })

    const openInvoiceEditModal = ({ uuid }) => {
        setSelectedInvoiceId(uuid)
        setIsManualInvoiceModalOpen(true)
    }

    const [columnDefs] = useState([
        {
            field: 'edit',
            headerName: '',
            headerTooltip: "Modifier l'utilisateur",
            cellClass: 'edit-column',
            pinned: 'left',
            maxWidth: 60,
            filter: false,
            sortable: false,
            cellRenderer: ({ data }) => (
                <Button
                    variant="primary"
                    onClick={() => openInvoiceEditModal({ uuid: data.uuid })}
                    size="sm"
                    className="edit-button-style"
                >
                    <FontAwesomeIcon icon={faPen} />
                </Button>
            ),
        },
        {
            field: 'invoiceNumber',
            headerName: 'Numéro de facture',
            tooltipField: 'invoiceNumber',
            headerTooltip: 'Numéro de facture',
            filter: 'agNumberColumnFilter',
            width: 190,
            valueGetter: deriveInvoiceNumber,
        },
        {
            field: 'invoiceDate',
            headerName: 'Date de facture',
            tooltipField: 'invoiceDate',
            headerTooltip: 'Date de facture',
            filter: 'agDateColumnFilter',
            width: 170,
            valueFormatter: ({ value }) =>
                DateTime.fromISO(value, { zone: 'UTC' }).setLocale('fr-CH').toLocaleString(DateTime.DATE_SHORT),
        },
        {
            field: 'client',
            headerName: 'Client',
            tooltipField: 'client',
            headerTooltip: 'Organisation/Utilisateur',
            filter: 'agTextColumnFilter',
            valueGetter: ({ data }) => (data?.organizationCode !== 'NREF' ? data?.organizationName : 'Nom+Prénom'),
        },
        {
            field: 'organizationName',
            headerName: 'Organisation',
            tooltipField: 'organizationName',
            headerTooltip: 'Organisation',
            filter: 'agSetColumnFilter',
            hide: true,
        },
        {
            field: 'statut',
            headerName: 'Statut',
            tooltipField: 'statut',
            headerTooltip: 'Statut',
            filter: 'agSetColumnFilter',
            width: 150,
        },
        {
            field: 'courseYear',
            headerName: 'Année',
            tooltipField: 'courseYear',
            headerTooltip: 'Année de formation',
            filter: 'agNumberColumnFilter',
            width: 120,
        },
        {
            field: 'userFullName',
            headerName: 'Créateur',
            tooltipField: 'userFullName',
            headerTooltip: "Le nom complet de l'utilisateur qui a créé la facture",
            filter: 'agTextColumnFilter',
            valueGetter: ({ data }) => `${data?.user.lastName} ${data?.user.firstName}`,
        },
        {
            field: 'itemAmounts',
            headerName: 'Total hors TVA',
            tooltipField: 'itemAmounts',
            headerTooltip: 'La somme des montants des articles, hors TVA',
            filter: 'agTextColumnFilter',
            width: 170,
            valueGetter: ({ data }) =>
                data?.itemAmounts
                    ?.split('\\')
                    .reduce((a, b) => Number(a) + Number(b))
                    .toFixed(2),
        },
    ])

    return (
        <>
            <Helmet>
                <title>Factures manuelles - Former22</title>
            </Helmet>
            <Grid
                name="Factures manuelles"
                columnDefs={columnDefs}
                rowData={invoicesData}
                isDataLoading={isFetchingInvoices}
                getContextMenuItems={({
                    node: { data },
                    columnApi: {
                        columnModel: { columnDefs: gridColumnDefs },
                    },
                }) => [
                    {
                        name: 'Exporter pour Crésus',
                        action: () => {
                            const csvClient = Papa.unparse({
                                fields: [
                                    'Numéro',
                                    'Firme',
                                    'Titre',
                                    'Nom',
                                    'Prénom',
                                    'Adresse 1',
                                    'Adresse 2',
                                    'NPA',
                                    'Localité',
                                    'Pays',
                                    'Tel Prof',
                                    'E-mail',
                                ],
                                data: [
                                    [
                                        deriveInvoiceNumber({ data }),
                                        data.organizationName,
                                        '',
                                        '',
                                        '',
                                        'Adresse 1',
                                        'Adresse 2',
                                        'NPA',
                                        'Localité',
                                        'Pays',
                                        'Tel Prof',
                                        'E-mail',
                                    ],
                                ],
                            })
                            console.log(
                                '🚀 ~ file: ManualInvoicesPage.jsx ~ line 185 ~ ManualInvoicesPage ~ csvClient',
                                csvClient
                            )
                            const csvFacture = Papa.unparse({ fields: [], data: [] })

                            downloadCsvFile({ csv: csvClient, fileName: 'CSV Client pour Crésus' })
                            downloadCsvFile({ csv: csvFacture, fileName: 'CSV Facture pour Crésus' })
                        },
                    },
                    'separator',
                    ...gridContextMenu,
                ]}
            />
            <Container fluid className="mb-2">
                <Button variant="success" className="me-2" onClick={() => setIsManualInvoiceModalOpen(true)}>
                    Créer facture manuelle
                </Button>
            </Container>
            <ManualInvoiceModal
                refetchInvoices={refetchInvoices}
                selectedInvoiceData={invoicesData?.find(({ uuid }) => uuid === selectedInvoiceId)}
                closeModal={() => {
                    setIsManualInvoiceModalOpen(false)
                    setSelectedInvoiceId()
                }}
                isModalOpen={isManualInvoiceModalOpen}
            />
        </>
    )
}
