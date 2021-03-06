import React from 'react';
import { RepositoryService } from '../../services/RepositoryService';
import { Row, Col, Form, DropdownButton, Dropdown, Button, Breadcrumb } from 'react-bootstrap';
import BootstrapTable from 'react-bootstrap-table-next';
import ToolkitProvider, { Search } from 'react-bootstrap-table2-toolkit';

var HttpStatus = require('http-status-codes');

export class Analysis extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            codebases: [],
            codebase: {},
            graphs: [],
            isUploaded: "",
            graph1: {},
            graph2: {},
            resultData: {},
            falsePairs: []
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        this.loadCodebases();
    }

    loadCodebases() {
        const service = new RepositoryService();
        service.getCodebases().then(response => {
            this.setState({
                codebases: response.data
            });
        });
    }

    setCodebase(codebase) {
        this.setState({
            codebase: codebase,
            graphs: codebase.dendrograms.map(dendrogram => dendrogram.graphs).flat()
        });
    }

    setGraph1(graph) {
        this.setState({
            graph1: graph
        });
    }

    setGraph2(graph) {
        this.setState({
            graph2: graph
        });
    }

    handleSubmit(event) {
        event.preventDefault();

        this.setState({
            isUploaded: "Uploading..."
        });

        let requestData = {
            "graph1": this.state.graph1,
            "graph2": this.state.graph2
        };

        const service = new RepositoryService();
        service.analysis(requestData).then(response => {
            if (response.status === HttpStatus.OK) {
                this.setState({
                    resultData: response.data,
                    falsePairs: response.data.falsePairs,
                    isUploaded: "Upload completed successfully."
                });
            } else {
                this.setState({
                    isUploaded: "Upload failed."
                });
            }
        })
        .catch(error => {
            this.setState({
                isUploaded: "Upload failed."
            });
        });
    }

    renderBreadCrumbs = () => {
        return (
            <Breadcrumb>
                <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                <Breadcrumb.Item active>Microservice Analysis</Breadcrumb.Item>
            </Breadcrumb>
        );
    }

    render() {

        const falsePairRows = this.state.falsePairs.map(falsePair => {
            return {
                id: falsePair[0] + falsePair[3],
                e1: falsePair[0],
                e1g1: falsePair[1],
                e1g2: falsePair[2],
                e2: falsePair[3],
                e2g1: falsePair[4],
                e2g2: falsePair[5]
            } 
        });

        const { SearchBar } = Search;

        const falsePairColumns = [{
            dataField: 'e1',
            text: 'Entity 1',
            sort: true
        }, {
            dataField: 'e1g1',
            text: this.state.graph1.name,
            sort: true
        }, {
            dataField: 'e1g2',
            text: this.state.graph2.name,
            sort: true
        }, {
            dataField: 'space',
            text: ''
        }, {
            dataField: 'e2',
            text: 'Entity 2',
            sort: true
        }, {
            dataField: 'e2g1',
            text: this.state.graph1.name,
            sort: true
        }, {
            dataField: 'e2g2',
            text: this.state.graph2.name,
            sort: true
        }];

        return (
            <div>
                {this.renderBreadCrumbs()}
                <h4 style={{color: "#666666"}}>Microservice Analysis</h4>

                <Form onSubmit={this.handleSubmit}>
                    <Form.Group as={Row} controlId="codebase">
                        <Form.Label column sm={2}>
                            Codebase
                        </Form.Label>
                        <Col sm={5}>
                            <DropdownButton title={Object.keys(this.state.codebase).length === 0 ? "Select Codebase" : this.state.codebase.name}>
                                {this.state.codebases.map(codebase => 
                                    <Dropdown.Item 
                                        key={codebase.name}
                                        onClick={() => this.setCodebase(codebase)}>{codebase.name}</Dropdown.Item>)}
                            </DropdownButton>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="sourceOfTruth">
                        <Form.Label column sm={2}>
                            Source of Truth
                        </Form.Label>
                        <Col sm={5}>
                            <DropdownButton title={Object.keys(this.state.graph1).length === 0 ? "Select Cut" : this.state.graph1.name + " from " + this.state.graph1.dendrogramName}>
                                {this.state.graphs.filter(graph => graph.expert === true).map(graph =>
                                    <Dropdown.Item
                                        key={graph.name}
                                        onClick={() => this.setGraph1(graph)}>{graph.name + " from " + graph.dendrogramName}</Dropdown.Item>)}
                                <Dropdown.Divider />
                                {this.state.graphs.filter(graph => graph.expert === false).map(graph => 
                                    <Dropdown.Item
                                        key={graph.name}
                                        onClick={() => this.setGraph1(graph)}>{graph.name + " from " + graph.dendrogramName}</Dropdown.Item>)}
                            </DropdownButton>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row} controlId="compareToCut">
                        <Form.Label column sm={2}>
                            Compare to Cut
                        </Form.Label>
                        <Col sm={5}>
                            <DropdownButton title={Object.keys(this.state.graph2).length === 0 ? "Select Cut" : this.state.graph2.name + " from " + this.state.graph2.dendrogramName}>
                                {this.state.graphs.filter(graph => graph.expert === true).map(graph =>
                                    <Dropdown.Item
                                        key={graph.name}
                                        onClick={() => this.setGraph2(graph)}>{graph.name + " from " + graph.dendrogramName}</Dropdown.Item>)}
                                <Dropdown.Divider />
                                {this.state.graphs.filter(graph => graph.expert === false).map(graph => 
                                    <Dropdown.Item
                                        key={graph.name}
                                        onClick={() => this.setGraph2(graph)}>{graph.name + " from " + graph.dendrogramName}</Dropdown.Item>)}
                            </DropdownButton>
                        </Col>
                    </Form.Group>

                    <Form.Group as={Row}>
                        <Col sm={{ span: 5, offset: 2 }}>
                            <Button type="submit"
                                    disabled={Object.keys(this.state.codebase).length === 0 || 
                                            Object.keys(this.state.graph1).length === 0 || 
                                            Object.keys(this.state.graph2).length === 0}>
                                Submit
                            </Button>
                            <Form.Text>
                                {this.state.isUploaded}
                            </Form.Text>
                        </Col>
                    </Form.Group>
                </Form>

                {Object.keys(this.state.resultData).length !== 0 &&
                    <div>
                        TP : {this.state.resultData.truePositive}< br/>
                        TN : {this.state.resultData.trueNegative}< br/>
                        FP : {this.state.resultData.falsePositive}< br/>
                        FN : {this.state.resultData.falseNegative}< br/>
                        Accuracy : {this.state.resultData.accuracy}< br/>
                        Precision : {this.state.resultData.precision}< br/>
                        Recall : {this.state.resultData.recall}< br/>
                        Specificity : {this.state.resultData.specificity === -1 ? "--" : this.state.resultData.specificity}< br/>
                        F-Score : {this.state.resultData.fmeasure}

                        <hr />
                        <h4 style={{color: "#666666"}}>False Pairs</h4>

                        <ToolkitProvider
                            bootstrap4
                            keyField="id"
                            data={ falsePairRows }
                            columns={ falsePairColumns }
                            search>
                            {
                                props => (
                                    <div>
                                        <SearchBar { ...props.searchProps } />
                                        <BootstrapTable { ...props.baseProps } />
                                    </div>
                                )
                            }
                        </ToolkitProvider>
                    </div>
                }
            </div>
        )
    }
}