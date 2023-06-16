import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Helmet } from 'react-helmet-async'
import { toast } from 'react-toastify'

import { Grid, StatusUpdateModal, MassStatusUpdateModal } from '../components'
import { fetchInscriptionsAction, updateInscriptionStatusAction } from '../actions/inscriptions'
import { inscriptionsSelector } from '../reducers'
import {
    inscriptionStatuses,
    formatDate,
    inscriptionsGridRowClassRules,
    gridContextMenu,
    FINAL_STATUSES,
    STATUSES,
    UNSELECTABLE_STATUSES,
    lockGroups,
    checkAreInSameLockGroup,
    StatusesValues,
} from '../utils'
import { useUpdateInscriptionStatusMutation } from '../services/inscriptions'
import { ChangeOrganizationModal } from '../components/ChangeOrganizationModal'
import { useUpdateOrganizationMutation } from '../services/inscriptions'

export function InscriptionsPage() {
    const dispatch = useDispatch()
    const [statusUpdateData, setStatusUpdateData] = useState(null)
    const [statusMassUpdateData, setStatusMassUpdateData] = useState<{
        status: StatusesValues
        newStatus: StatusesValues
        isCreatingAttestation?: boolean
    } | null>(null)
    const [selectedRowsData, setSelectedRowsData] = useState<any[]>([])
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false)
    const [isMassUpdateModalVisible, setIsMassUpdateModalVisible] = useState(false)
    const [selectedInscriptionId, setSelectedInscriptionId] = useState(null)
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

    const checkIsSingleUpdatePossible = ({ status }: { status: StatusesValues }) =>
        selectedRowsData.length <= 1 && !FINAL_STATUSES.some((finalStatus) => finalStatus === status)

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
                comparator: (_valueA: any, _valueB: any, nodeA: any, nodeB: any) => {
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
                comparator: (_valueA: any, _valueB: any, nodeA: any, nodeB: any) => {
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
                comparator: (_valueA: any, _valueB: any, nodeA: any, nodeB: any) => {
                    return nodeA.key?.localeCompare(nodeB.key)
                },
                valueGetter: ({ data }: { data: any }) =>
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
                valueGetter: ({ data }: { data: any }) =>
                    data?.isPending
                        ? data?.startDate
                        : formatDate({ dateString: data?.startDate, isDateVisible: true }),
            },
            {
                field: 'participant',
                headerName: 'Participant',
                filter: 'agSetColumnFilter',
                filterParams: { excelMode: 'windows' },
                headerTooltip: "L'utilisateur qui est inscrit à la session",
                checkboxSelection: true,
                headerCheckboxSelection: true,
                aggFunc: 'count',
            },
            { field: 'profession', headerName: 'Fonction/Profession' },
            {
                field: 'status',
                headerName: 'Statut',
                filter: 'agSetColumnFilter',
                headerTooltip: "Le statut de l'utilisateur",
            },
            {
                field: 'attestationTitle',
                headerName: 'Attestation',
                filter: 'agTextColumnFilter',
                headerTooltip: "Le modèle choisi pour l'attestation de l'utilisateur",
            },
            {
                field: 'organization',
                headerName: 'Organisation',
                filter: 'agTextColumnFilter',
                headerTooltip: "L'organisation de l'utilisateur",
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
                field: 'email',
                headerName: 'E-mail',
                filter: 'agTextColumnFilter',
                headerTooltip: "L'e-mail de l'utilisateur",
            },
            {
                field: 'type',
                headerName: "Type d'inscription",
                filter: 'agSetColumnFilter',
                // setting default value for data resolves an uncaught type error
                valueGetter: ({ data: { type } = {} }: { data: { type?: any } }) =>
                    ((
                        {
                            cancellation: 'Annulation',
                            learner: 'Participant',
                            tutor: 'Formateur',
                            pending: 'En attente', // ?
                            group: 'Groupe', // ?
                        } as any
                    )[type] ?? type),
            },

            {
                field: 'quotaDays',
                headerName: 'Jours de quota',
                filter: 'agNumberColumnFilter',
                headerTooltip: 'Les jours de quota de la session',
                type: 'numericColumn',
            },
            {
                field: 'isUsedForQuota',
                headerName: 'Utilisé pour quotas',
                filter: 'agSetColumnFilter',
                headerTooltip: 'Les quotas de la session',
                valueGetter: ({ data }: { data: any }) =>
                    typeof data === 'undefined' ? '' : data.isUsedForQuota ? 'Utilisé' : 'Non-utilisé',
            },
            {
                field: 'validationType',
                headerName: 'Type de validation par RH',
                filter: 'agSetColumnFilter',
                headerTooltip: 'Type de validation par RH',
            },
            {
                field: 'organizationClientNumber',
                headerName: 'Numéro de Client',
                filter: 'agSetColumnFilter',
                headerTooltip: 'Numéro de Client',
            },
            {
                field: 'coursePrice',
                headerName: 'Prix de la formation',
                filter: 'agNumberColumnFilter',
                headerTooltip: 'Prix de la formation',
                type: 'numericColumn',
            },
            {
                field: 'courseDuration',
                headerName: 'Durée de la formation',
                filter: 'agNumberColumnFilter',
                headerTooltip: 'Durée de la formation',
                type: 'numericColumn',
            },
            {
                field: 'codeCategory',
                headerName: 'Code catégorie',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Le code catégorie',
                width: 150,
            },
            {
                field: 'theme',
                headerName: 'Thème',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Le thème de la formation',
            },
            {
                field: 'targetAudience',
                headerName: 'Public cible',
                filter: 'agTextColumnFilter',
                headerTooltip: 'Le public cible',
            },
            {
                field: 'invoiceNumber',
                headerName: 'Facture',
                tooltipField: 'invoiceNumber',
                headerTooltip: 'Numéro de facture',
                filter: 'agTextColumnFilter',
            },
        ],
        []
    )

    const rowData = inscriptions
        .filter((current: any) => current != null)
        .map(
            ({
                id,
                user = {},
                session,
                status,
                attestationTitle,
                inscriptionDate,
                type,
                coordinator,
                codeCategory,
                theme,
                targetAudience,
                isPending,
                validationType,
                organizationClientNumber,
                invoiceNumber,
            }: any) => ({
                id,
                participant: user.lastName != null ? `${user.lastName} ${user.firstName}` : 'Aucune inscription',
                profession: user.profession,
                type,
                sessionName: session.name,
                quotaDays: session.quotaDays,
                isUsedForQuota: session.isUsedForQuota,
                status,
                attestationTitle,
                startDate: session.startDate,
                inscriptionDate,
                organizationCode: user.organizationCode,
                hierarchy: user.hierarchy,
                organization: user.organization,
                email: user.email,
                coordinator,
                codeCategory,
                theme,
                targetAudience,
                courseName: session.courseName,
                coursePrice: session.coursePrice,
                courseDuration: session.courseDuration,
                startYear: session.startYear,
                isPending,
                validationType,
                organizationClientNumber,
                invoiceNumber,
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
                getContextMenuItems={(
                    { node: { data } = { data: {} } }: { node: { data: any } } = { node: { data: {} } }
                ) => {
                    const checkLockGroupForSelectedStatus = checkAreInSameLockGroup(data?.status)

                    return [
                        {
                            name: 'Envoyer e-mail',
                            action: () => {
                                setIsUpdateModalVisible(true)
                                setStatusUpdateData({
                                    ...inscriptions.find(({ id }: { id: string }) => id === data?.id),
                                    newStatus: data?.status,
                                })
                            },
                        },
                        selectedRowsData.length <= 1 && {
                            name: 'Modifier statut',
                            disabled:
                                !checkIsSingleUpdatePossible({ status: data?.status }) &&
                                !lockGroups.some((group) => group.includes(data?.status)),
                            tooltip: FINAL_STATUSES.includes(data?.status) ? 'Statut final (non modifiable)' : '',
                            subMenu: inscriptionStatuses.map((currentStatus) => ({
                                name: currentStatus,
                                action: () => {
                                    setIsUpdateModalVisible(true)
                                    setStatusUpdateData({
                                        ...inscriptions.find(({ id }: { id: string }) => id === data?.id),
                                        newStatus: currentStatus,
                                    })
                                },
                                disabled:
                                    currentStatus === data?.status ||
                                    UNSELECTABLE_STATUSES.includes(currentStatus as any) ||
                                    (FINAL_STATUSES.includes(data?.status as any) &&
                                        !checkLockGroupForSelectedStatus(currentStatus)),
                                checked: currentStatus === data?.status,
                                icon:
                                    FINAL_STATUSES.includes(currentStatus as any) &&
                                    !UNSELECTABLE_STATUSES.includes(currentStatus as any)
                                        ? '!'
                                        : '',
                                tooltip:
                                    currentStatus === data?.status
                                        ? 'Statut actuel de la sélection'
                                        : UNSELECTABLE_STATUSES.includes(currentStatus as any)
                                        ? 'Statut dérivé (non sélectionnable)'
                                        : FINAL_STATUSES.includes(currentStatus as any)
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
                                        status: data?.status,
                                        newStatus: currentStatus,
                                    })
                                },
                                disabled:
                                    currentStatus === data?.status ||
                                    UNSELECTABLE_STATUSES.includes(currentStatus as any),
                                checked: currentStatus === data?.status,
                                icon:
                                    FINAL_STATUSES.includes(currentStatus as any) &&
                                    !UNSELECTABLE_STATUSES.includes(currentStatus as any)
                                        ? '!'
                                        : '',
                                tooltip:
                                    currentStatus === data?.status
                                        ? 'Statut actuel de la sélection'
                                        : UNSELECTABLE_STATUSES.includes(currentStatus as any)
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
                                        ...inscriptions.find(({ id }: { id: string }) => id === data?.id),
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
                        selectedRowsData.length <= 1 && /*FINAL_STATUSES.includes(data?.status) &&*/ {
                            name: "Modifier l'organisation",
                            action: () => {
                                if (data != null) {
                                    setSelectedInscriptionId(data.id)
                                }
                            },
                        },
                        'separator',
                        ...gridContextMenu,
                    ]
                }}
                onRowSelected={({
                    api: {
                        selectionService: { selectedNodes },
                    },
                }: any) => {
                    const filteredSelectedRowsData =
                        Object.values(selectedNodes).reduce(
                            (previous: any[], current: any) => [
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

            {isUpdateModalVisible && (statusUpdateData as any) && (
                <StatusUpdateModal
                    closeModal={() => {
                        setStatusUpdateData(null)
                        setIsUpdateModalVisible(false)
                        dispatch(fetchInscriptionsAction())
                    }}
                    statusUpdateData={statusUpdateData}
                    updateStatus={({ emailTemplateId, shouldSendSms, selectedAttestationTemplateUuid }: any) =>
                        dispatch(
                            updateInscriptionStatusAction({
                                inscriptionId: (statusUpdateData as any)?.id,
                                newStatus: (statusUpdateData as any)?.newStatus,
                                emailTemplateId,
                                selectedAttestationTemplateUuid,
                                shouldSendSms,
                                successCallback: () => {
                                    setIsUpdateModalVisible(false)
                                    setStatusUpdateData(null)
                                    dispatch(fetchInscriptionsAction())
                                    toast.success(
                                        `Statut d'inscription modifié de "${(statusUpdateData as any)?.status}" à "${
                                            (statusUpdateData as any)?.newStatus
                                        }"`
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
                    updateStatus={async ({
                        emailTemplateId,
                        selectedAttestationTemplateUuid,
                    }: {
                        emailTemplateId: string
                        selectedAttestationTemplateUuid: string
                    }) => {
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

            <ChangeOrganizationModal
                inscriptionId={selectedInscriptionId}
                onHide={() => setSelectedInscriptionId(null)}
                onDone={() => dispatch(fetchInscriptionsAction())}
            />
        </>
    )
}
