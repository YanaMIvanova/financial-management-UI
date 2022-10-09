import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import { toast } from 'react-toastify'

import { Grid, StatusUpdateModal, MassStatusUpdateModal } from '../components'
import {
    fetchInscriptionsAction,
    updateInscriptionStatusAction,
    // massUpdateInscriptionStatusesAction,
} from '../actions/inscriptions.ts'
import { inscriptionsSelector } from '../reducers'
import {
    inscriptionStatuses,
    formatDate,
    inscriptionsGridRowClassRules,
    gridContextMenu,
    FINAL_STATUSES,
    STATUSES,
    UNSELECTABLE_STATUSES,
    specialCharsDecodingFormatter,
} from '../utils'
import { useUpdateInscriptionStatusMutation } from '../services/inscriptions'

export function InscriptionsPage() {
    const dispatch = useDispatch()
    const [statusUpdateData, setStatusUpdateData] = useState(null)
    const [statusMassUpdateData, setStatusMassUpdateData] = useState(null)
    const [selectedRowsData, setSelectedRowsData] = useState([])
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false)
    const [isMassUpdateModalVisible, setIsMassUpdateModalVisible] = useState(false)
    const inscriptions = useSelector(inscriptionsSelector)
    const [activePredefinedFiltersById, setActivePredefinedFiltersById] = useState({ onlyWebEntries: true })

    const [updateInscriptionStatus, { isLoading: isUpdatingInscriptionStatus }] = useUpdateInscriptionStatusMutation()

    const predefinedFilters = [
        { id: 'onlyWebEntries', label: [STATUSES.ENTREE_WEB, STATUSES.VALIDE_PAR_RH].join('; ') },
        // { id: 'filter2', label: 'Filter 2' },
    ]

    useEffect(() => {
        dispatch(fetchInscriptionsAction())
    }, [dispatch])

    const isMassUpdatePossible =
        selectedRowsData.length > 1 &&
        selectedRowsData.every((current, index, array) => {
            const isFinalStatus = FINAL_STATUSES.includes(current.status)
            const isSameStatus = index > 0 ? array[index - 1].status === current.status : true

            if (!isFinalStatus && isSameStatus) {
                return true
            }

            return false
        })

    const checkIsSingleUpdatePossible = ({ status }) => selectedRowsData.length <= 1 && !FINAL_STATUSES.includes(status)

    const columnDefs = useMemo(
        () => [
            {
                field: 'coordinator',
                headerName: 'CF (coordinateur)',
                filter: 'agSetColumnFilter',
                headerTooltip: 'Le coordinateur de la formation',
                width: 170,
                rowGroup: true,
                hide: true,
                // TODO: sort ignoring accents
                comparator: (_valueA, _valueB, nodeA, nodeB) => {
                    return nodeA.key?.localeCompare(nodeB.key)
                },
            },
            {
                field: 'startYear',
                headerName: 'Année de début',
                filter: 'agDateColumnFilter',
                headerTooltip: "L'année de début de la session",
                sort: 'asc',
                type: 'numericColumn',
                rowGroup: true,
                hide: true,
            },
            {
                field: 'courseName',
                headerName: 'Formation',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Le nom de la formation',
                rowGroup: true,
                hide: true,
                // TODO: sort ignoring accents
                comparator: (_valueA, _valueB, nodeA, nodeB) => {
                    return nodeA.key?.localeCompare(nodeB.key)
                },
            },
            {
                field: 'sessionName',
                headerName: 'Session',
                filter: 'agTextColumnFilter',
                headerTooltip: "Le nom de la session dans laquelle l'utilisateur s'est inscrit",
                rowGroup: true,
                hide: true,
                // TODO: sort ignoring accents
                comparator: (_valueA, _valueB, nodeA, nodeB) => {
                    return nodeA.key?.localeCompare(nodeB.key)
                },
                valueGetter: ({ data }) =>
                    `${data?.sessionName} [${
                        data?.isPending
                            ? data?.startDate
                            : formatDate({ dateString: data?.startDate, isDateVisible: true })
                    }]`,
            },
            {
                field: 'startDate',
                headerName: 'Date de début',
                filter: 'agDateColumnFilter',
                headerTooltip: 'La date de début de la session',
                type: 'numericColumn',
                valueGetter: ({ data }) =>
                    data?.isPending
                        ? data?.startDate
                        : formatDate({ dateString: data?.startDate, isDateVisible: true }),
            },
            {
                field: 'status',
                headerName: 'Statut',
                filter: 'agSetColumnFilter',
                headerTooltip: "Le statut de l'utilisateur",
            },
            {
                field: 'civility',
                headerName: 'Civilité',
                filter: 'agSetColumnFilter',
                filterParams: { excelMode: 'windows' },
                headerTooltip: "La civilité de l'utilisateur qui est inscrit à la session",
            },
            {
                field: 'lastName',
                headerName: 'Nom',
                filter: 'agSetColumnFilter',
                filterParams: { excelMode: 'windows' },
                headerTooltip: "Le nom de l'utilisateur qui est inscrit à la session",
                checkboxSelection: true,
                headerCheckboxSelection: true,
                aggFunc: 'count',
            },
            {
                field: 'firstName',
                headerName: 'Prenom',
                filter: 'agSetColumnFilter',
                filterParams: { excelMode: 'windows' },
                headerTooltip: "Le prenom de l'utilisateur qui est inscrit à la session",
            },
            {
                field: 'email',
                headerName: 'E-mail',
                filter: 'agTextColumnFilter',
                headerTooltip: "L'e-mail de l'utilisateur",
            },
            {
                field: 'phoneNumber',
                headerName: 'Numéro de téléphone portable',
                filter: 'agTextColumnFilter',
                headerTooltip: "Le Numéro de téléphone portable de l'utilisateur",
            },
            {
                field: 'birthDate',
                headerName: 'Date de naissance',
                filter: 'agDateColumnFilter',
                headerTooltip: "La date de naissance de l'utilisateur",
            },
            {
                field: 'avsNumber',
                headerName: 'Numéro AVS',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Numéro AVS',
            },
            {
                field: 'companyName',
                headerName: "Nom de l'entreprise",
                filter: 'agTextColumnFilter',
                headerTooltip: "Nom de l'entreprise",
            },
            {
                field: 'serviceOrSectorInCompany',
                headerName: "Service ou secteur dans l'entreprise",
                filter: 'agTextColumnFilter',
                headerTooltip: "Service ou secteur dans l'entreprise",
            },
            {
                field: 'workplaceAddress',
                headerName: 'Adresse du lieu de travail (rue et numéro)',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Adresse du lieu de travail (rue et numéro)',
            },
            {
                field: 'homeAddress',
                headerName: 'Adresse du domicile (rue et numéro)',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Adresse du domicile (rue et numéro)',
            },
            {
                field: 'additionalAddressInfo',
                headerName: 'Complément adresse',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Complément adresse',
            },
            {
                field: 'postalCode',
                headerName: 'Code postal',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Code postal',
            },
            {
                field: 'locality',
                headerName: 'Localité',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Localité',
            },
            {
                field: 'employer',
                headerName: 'Employeur (entreprise, adresse, code postal et localité)',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Employeur (entreprise, adresse, code postal et localité)',
            },
            {
                field: 'diplomaName',
                headerName: 'Nom du diplôme',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Nom du diplôme',
            },
            {
                field: 'professionName',
                headerName: 'Nom de la profession',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Nom de la profession',
            },
            {
                field: 'attestationTitle',
                headerName: 'Attestation',
                filter: 'agTextColumnFilter',
                headerTooltip: "Le modèle choisi pour l'attestation de l'utilisateur",
                initialHide: true,
            },
            {
                field: 'organization',
                headerName: 'Organisation',
                filter: 'agTextColumnFilter',
                headerTooltip: "L'organisation de l'utilisateur",
                initialHide: true,
            },
            {
                field: 'organizationCode',
                headerName: "Code de l'organisation",
                filter: 'agTextColumnFilter',
                headerTooltip: "Le code d'organization de l'utilisateur",
                initialHide: true,
            },
            {
                field: 'hierarchy',
                headerName: "Hiérarchie de l'entité/entreprise",
                filter: 'agTextColumnFilter',
                headerTooltip: "L'organisation de l'utilisateur",
                initialHide: true,
            },
            {
                field: 'type',
                headerName: "Type d'inscription",
                filter: 'agSetColumnFilter',
                initialHide: true,
                // setting default value for data resolves an uncaught type error
                valueGetter: ({ data: { type } = {} }) =>
                    ({
                        cancellation: 'Annulation',
                        learner: 'Participant',
                        tutor: 'Formateur',
                        pending: 'En attente', // ?
                        group: 'Groupe', // ?
                    }[type] ?? type),
            },

            {
                field: 'quotaDays',
                headerName: 'Jours de quota',
                filter: 'agNumberColumnFilter',
                headerTooltip: 'Les jours de quota de la session',
                type: 'numericColumn',
                initialHide: true,
            },
            {
                field: 'isUsedForQuota',
                headerName: 'Utilisé pour quotas',
                filter: 'agSetColumnFilter',
                headerTooltip: 'Les quotas de la session',
                initialHide: true,
                valueGetter: ({ data }) =>
                    typeof data === 'undefined' ? '' : data.isUsedForQuota ? 'Utilisé' : 'Non-utilisé',
            },
        ],
        []
    )

    const rowData = inscriptions
        .filter((current) => current != null)
        .map(
            ({
                id,
                user: {
                    civility,
                    lastName = 'Aucune inscription',
                    firstName = 'Aucune inscription',
                    email,
                    phoneNumber,
                    birthDate,
                    avsNumber,
                    companyName,
                    serviceOrSectorInCompany,
                    workplaceAddress,
                    homeAddress,
                    additionalAddressInfo,
                    postalCode,
                    locality,
                    employer,
                    diplomaName,
                    professionName,
                    organizationCode,
                    hierarchy,
                    organization,
                } = {},
                session,
                status,
                attestationTitle,
                inscriptionDate,
                type,
                coordinator,
                isPending,
            }) => ({
                id,
                civility,
                lastName,
                firstName,
                email,
                phoneNumber,
                birthDate,
                avsNumber,
                companyName,
                serviceOrSectorInCompany,
                workplaceAddress,
                homeAddress,
                additionalAddressInfo,
                postalCode,
                locality,
                employer,
                diplomaName,
                professionName,
                type,
                sessionName: session.name,
                quotaDays: session.quotaDays,
                isUsedForQuota: session.isUsedForQuota,
                status,
                attestationTitle,
                startDate: session.startDate,
                inscriptionDate,
                organizationCode,
                hierarchy,
                organization,
                coordinator,
                courseName: session.courseName,
                startYear: session.startYear,
                isPending,
            })
        )

    return (
        <>
            <Helmet>
                <title>Participants - Former22</title>
            </Helmet>
            <Grid
                name="Participants"
                /* TODO: decouple active filters from Grid? */
                activePredefinedFiltersById={activePredefinedFiltersById}
                setActivePredefinedFiltersById={setActivePredefinedFiltersById}
                predefinedFilters={predefinedFilters}
                columnDefs={columnDefs}
                rowData={rowData}
                rowClassRules={inscriptionsGridRowClassRules}
                autoGroupColumnDef={{
                    minWidth: 480,
                    cellRendererParams: {
                        suppressCount: true,
                    },
                }}
                defaultColDef={{
                    aggFunc: false,
                    valueFormatter: specialCharsDecodingFormatter,
                }}
                defaultSortModel={[
                    { colId: 'coordinator', sort: 'asc', sortIndex: 0 },
                    { colId: 'startYear', sort: 'asc', sortIndex: 1 },
                    { colId: 'courseName', sort: 'asc', sortIndex: 2 },
                    { colId: 'sessionName', sort: 'asc', sortIndex: 3 },
                    { colId: 'participant', sort: 'asc', sortIndex: 4 },
                ]}
                groupDefaultExpanded={1}
                groupDisplayType="groupRows"
                groupIncludeFooter={false}
                getContextMenuItems={({ node: { data } }) => [
                    {
                        name: 'Envoyer e-mail',
                        action: () => {
                            setIsUpdateModalVisible(true)
                            setStatusUpdateData({
                                ...inscriptions.find(({ id }) => id === data?.id),
                                newStatus: data?.status,
                            })
                        },
                    },
                    selectedRowsData.length <= 1 && {
                        name: 'Modifier statut',
                        disabled: !checkIsSingleUpdatePossible({ status: data?.status }),
                        tooltip: FINAL_STATUSES.includes(data?.status) ? 'Statut final (non modifiable)' : '',
                        subMenu: inscriptionStatuses.map((currentStatus) => ({
                            name: currentStatus,
                            action: () => {
                                setIsUpdateModalVisible(true)
                                setStatusUpdateData({
                                    ...inscriptions.find(({ id }) => id === data?.id),
                                    newStatus: currentStatus,
                                })
                            },
                            disabled: currentStatus === data?.status || UNSELECTABLE_STATUSES.includes(currentStatus),
                            checked: currentStatus === data?.status,
                            icon:
                                FINAL_STATUSES.includes(currentStatus) && !UNSELECTABLE_STATUSES.includes(currentStatus)
                                    ? '!'
                                    : '',
                            tooltip:
                                currentStatus === data?.status
                                    ? 'Statut actuel de la sélection'
                                    : UNSELECTABLE_STATUSES.includes(currentStatus)
                                    ? 'Statut dérivé (non sélectionnable)'
                                    : FINAL_STATUSES.includes(currentStatus)
                                    ? 'Statut final !'
                                    : '',
                        })),
                    },
                    selectedRowsData.length > 1 && {
                        name: 'Modifier statut en mass',
                        disabled: !isMassUpdatePossible,
                        tooltip: !isMassUpdatePossible ? 'Statut final (non modifiable)' : '',
                        subMenu: inscriptionStatuses.map((currentStatus) => ({
                            name: currentStatus,
                            action: () => {
                                setIsMassUpdateModalVisible(true)
                                setStatusMassUpdateData({
                                    status: data.status,
                                    newStatus: currentStatus,
                                })
                            },
                            disabled: currentStatus === data.status || UNSELECTABLE_STATUSES.includes(currentStatus),
                            checked: currentStatus === data.status,
                            icon:
                                FINAL_STATUSES.includes(currentStatus) && !UNSELECTABLE_STATUSES.includes(currentStatus)
                                    ? '!'
                                    : '',
                            tooltip:
                                currentStatus === data.status
                                    ? 'Statut actuel de la sélection'
                                    : UNSELECTABLE_STATUSES.includes(currentStatus)
                                    ? 'Statut dérivé (non sélectionnable)'
                                    : '',
                        })),
                    },
                    selectedRowsData.length <= 1 && {
                        name: 'Créer attestation',
                        action: () => {
                            if (data != null) {
                                setIsUpdateModalVisible(true)
                                setStatusUpdateData({
                                    ...inscriptions.find(({ id }) => id === data?.id),
                                    newStatus: data?.status,
                                    isCreatingAttestation: true,
                                })
                            }
                        },
                    },
                    selectedRowsData.length > 1 && {
                        name: 'Créer attestation en masse',
                        action: () => {
                            if (data != null) {
                                setIsMassUpdateModalVisible(true)
                                setStatusMassUpdateData({
                                    status: data?.status,
                                    newStatus: data?.status,
                                    isCreatingAttestation: true,
                                })
                            }
                        },
                    },
                    'separator',
                    ...gridContextMenu,
                ]}
                onRowSelected={({
                    api: {
                        selectionService: { selectedNodes },
                    },
                }) => {
                    const filteredSelectedRowsData =
                        Object.values(selectedNodes).reduce(
                            (previous, current) => [
                                ...previous,
                                ...(typeof current !== 'undefined' && typeof previous !== 'undefined'
                                    ? [current.data]
                                    : []),
                            ],
                            []
                        ) || []

                    setSelectedRowsData(filteredSelectedRowsData)
                }}
            />

            {isUpdateModalVisible && statusUpdateData && (
                <StatusUpdateModal
                    closeModal={() => {
                        setStatusUpdateData(null)
                        setIsUpdateModalVisible(false)
                        dispatch(fetchInscriptionsAction())
                    }}
                    statusUpdateData={statusUpdateData}
                    updateStatus={({ emailTemplateId, shouldSendSms, selectedAttestationTemplateUuid }) =>
                        dispatch(
                            updateInscriptionStatusAction({
                                inscriptionId: statusUpdateData.id,
                                newStatus: statusUpdateData.newStatus,
                                emailTemplateId,
                                selectedAttestationTemplateUuid,
                                shouldSendSms,
                                successCallback: () => {
                                    setIsUpdateModalVisible(false)
                                    setStatusUpdateData(null)
                                    dispatch(fetchInscriptionsAction())
                                    toast.success(
                                        `Statut d'inscription modifié de "${statusUpdateData.status}" à "${statusUpdateData.newStatus}"`
                                    )
                                },
                            })
                        )
                    }
                />
            )}

            {isMassUpdateModalVisible && statusMassUpdateData && (
                <MassStatusUpdateModal
                    closeModal={() => {
                        setIsMassUpdateModalVisible(false)
                        setStatusMassUpdateData(null)
                        dispatch(fetchInscriptionsAction())
                    }}
                    inscriptionsData={statusMassUpdateData}
                    selectedRowsData={selectedRowsData}
                    isUpdating={isUpdatingInscriptionStatus}
                    updateStatus={async ({ emailTemplateId, selectedAttestationTemplateUuid }) => {
                        // dispatch(
                        //     massUpdateInscriptionStatusesAction({
                        //         inscriptionsIds: selectedRowsData.map(({ id }) => id),
                        //         newStatus: statusMassUpdateData.newStatus,
                        //         emailTemplateId,
                        //         successCallback: () => {
                        //             setIsMassUpdateModalVisible(false)
                        //             setStatusMassUpdateData(null)
                        //             dispatch(fetchInscriptionsAction())
                        //             toast.success(
                        //                 `Plusieurs statuts d'inscription changés de "${statusMassUpdateData.status}" à "${statusMassUpdateData.newStatus}"`
                        //             )
                        //         },
                        //     })
                        // )
                        // TODO: for-of:
                        // await updateInscriptionStatus() mutation for each selected row
                        // display toast with done/total

                        let hasErrors = false

                        for (const [index, { id, participant }] of selectedRowsData.entries()) {
                            const response = await updateInscriptionStatus({
                                inscriptionId: id,
                                newStatus: statusMassUpdateData.newStatus,
                                emailTemplateId,
                                selectedAttestationTemplateUuid,
                                shouldSendSms: false,
                            })

                            if (response.error) {
                                hasErrors = true

                                toast.error(
                                    `${index + 1}/${
                                        selectedRowsData.length
                                    } Erreur: Impossible de modifier le statut d'inscription de "${participant}" de "${
                                        statusMassUpdateData.status
                                    }" à "${statusMassUpdateData.newStatus}"`
                                )
                            } else {
                                toast.success(
                                    `${index + 1}/${
                                        selectedRowsData.length
                                    } Statut d'inscription de "${participant}" modifié de "${
                                        statusMassUpdateData.status
                                    }" à "${statusMassUpdateData.newStatus}"`
                                )
                            }
                        }

                        if (hasErrors) {
                            toast.error('Erreurs lors de la modification des statuts en masse.')
                        } else {
                            toast.success(
                                `Plusieurs statuts d'inscription changés de "${statusMassUpdateData.status}" à "${statusMassUpdateData.newStatus}"`
                            )
                        }

                        setIsMassUpdateModalVisible(false)
                        setStatusMassUpdateData(null)
                        dispatch(fetchInscriptionsAction()) // TODO: use RTK Query service instead
                    }}
                />
            )}
        </>
    )
}
