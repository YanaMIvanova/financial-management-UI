import { useState, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { Row, Col, InputGroup, FloatingLabel, FormControl, Button, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilterCircleXmark } from '@fortawesome/pro-light-svg-icons'

import { localeText } from '../agGridLocaleText'

export const Grid = ({ rowData, columnDefs }) => {
    const [gridApi, setGridApi] = useState(null)
    const [filterValue, setFilterValue] = useState('')

    useEffect(() => {
        gridApi?.setQuickFilter(filterValue)
    }, [filterValue, gridApi])

    return (
        <Row>
            <Col className="mb-4">
                <InputGroup>
                    <OverlayTrigger
                        placement="top"
                        delay={{ show: 50, hide: 150 }}
                        overlay={(props) => <Tooltip {...props}>Effacer le filtre</Tooltip>}
                    >
                        <Button variant="outline-danger" size="lg" onClick={() => setFilterValue('')}>
                            <FontAwesomeIcon icon={faFilterCircleXmark} />
                        </Button>
                    </OverlayTrigger>
                    <FloatingLabel label="Rechercher" className="grid-search-label">
                        <FormControl
                            placeholder="Rechercher..."
                            aria-label="Rechercher..."
                            aria-describedby="rechercher"
                            value={filterValue}
                            onChange={({ target }) => setFilterValue(target.value)}
                        />
                    </FloatingLabel>
                </InputGroup>
            </Col>
            <div className="ag-theme-alpine general-grid page mx-auto mb-4">
                <AgGridReact
                    {...{
                        sideBar: true,
                        enableCharts: true,
                        enableRangeSelection: true,
                        enableCellChangeFlash: true,
                        enableFillHandle: true,
                        paginationAutoPageSize: true,
                        animateRows: true,
                        groupIncludeFooter: true,
                        groupSelectsChildren: true,
                        debug: true,
                        rowSelection: 'multiple',
                        rowGroupPanelShow: 'always',
                        pivotPanelShow: 'always',
                        groupDisplayType: 'multipleColumns',
                        defaultColDef: {
                            enableValue: true,
                            enablePivot: true,
                            enableRowGroup: true,
                            resizable: true,
                            sortable: true,
                            filter: true,
                            aggFunc: 'count',
                        },
                        statusBar: {
                            statusPanels: [
                                { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
                                { statusPanel: 'agTotalRowCountComponent', align: 'center' },
                                { statusPanel: 'agFilteredRowCountComponent' },
                                { statusPanel: 'agSelectedRowCountComponent' },
                                { statusPanel: 'agAggregationComponent' },
                            ],
                        },
                        getContextMenuItems: () => [
                            'autoSizeAll',
                            'expandAll',
                            'contractAll',
                            'copy',
                            'copyWithHeaders',
                            'paste',
                            'resetColumns',
                            'export',
                            'chartRange',
                        ],
                        columnDefs,
                        rowData,
                        localeText,
                        onFirstDataRendered: ({ columnApi }) => columnApi.autoSizeAllColumns(),
                        onGridReady: ({ api }) => setGridApi(api),
                    }}
                />
            </div>
        </Row>
    )
}
