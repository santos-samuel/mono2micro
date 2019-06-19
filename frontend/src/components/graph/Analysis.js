import React from 'react';
import { RepositoryService } from '../../services/RepositoryService';
import { Form, InputGroup, DropdownButton, Dropdown, ButtonGroup, Button, Card, Breadcrumb, BreadcrumbItem } from 'react-bootstrap';
import { URL } from '../../constants/constants';
import BootstrapTable from 'react-bootstrap-table-next';

const BreadCrumbs = () => {
    return (
      <div>
        <Breadcrumb>
          <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
          <BreadcrumbItem active>Microservice Analysis</BreadcrumbItem>
        </Breadcrumb>
      </div>
    );
};

export class Analysis extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            codebases: [],
            codebase: "",
            dendrograms: [],
            experts: [],
            graph1: {},
            graph2: {}
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        this.load()
    }

    load() {
        const service = new RepositoryService();

        service.getCodebaseNames().then(response => {
            this.setState({
                codebases: response.data
            });
        });

        service.getDendrograms().then(response => {
            this.setState({
                dendrograms: response.data
            });
        });

        service.getExperts().then(response => {
            this.setState({
                experts: response.data
            });
        });
    }

    setCodebase(codebase) {
        this.setState({
            codebase: codebase
        })
    }

    setGraph1(graph) {
        this.setState({
            graph1: graph
        })
    }

    setGraph2(graph) {
        this.setState({
            graph2: graph
        })
    }

    handleSubmit(event) {
        event.preventDefault();
    }

    render() {
        return (
            <div>
                <BreadCrumbs />
                <h2 className="mb-3">Microservice Analysis</h2>

                <Form onSubmit={this.handleSubmit}>
                <InputGroup className="mb-3">
                <InputGroup.Prepend>
                    <InputGroup.Text id="basic-addon1">Codebase Name</InputGroup.Text>
                </InputGroup.Prepend>
                    <DropdownButton
                        title={this.state.codebase === "" ? "Select Codebase" : this.state.codebase}
                        id="input-group-dropdown-1"
                        >
                        {this.state.codebases.map(codebase => <Dropdown.Item onClick={() => this.setCodebase(codebase)}>{codebase}</Dropdown.Item>)}
                    </DropdownButton>
                </InputGroup>

                <InputGroup className="mb-3">
                <InputGroup.Prepend>
                    <InputGroup.Text id="basic-addon1">Source of Truth</InputGroup.Text>
                </InputGroup.Prepend>
                    <DropdownButton
                        title={Object.keys(this.state.graph1).length === 0 ? "Select Cut" : this.state.graph1.name + " from " + this.state.graph1.dendrogramName}
                        id="input-group-dropdown-1"
                        >
                        {this.state.experts.filter(expert => expert.codebase === this.state.codebase).map(expert => <Dropdown.Item onClick={() => this.setGraph1(expert)}>{"Expert: " + expert.name}</Dropdown.Item>)}
                        <Dropdown.Divider />
                        {this.state.dendrograms.filter(dend => dend.codebase === this.state.codebase).map(dend => dend.graphs).flat().map(graph => <Dropdown.Item onClick={() => this.setGraph1(graph)}>{graph.name + " from " + graph.dendrogramName}</Dropdown.Item>)}
                    </DropdownButton>
                </InputGroup>

                <InputGroup className="mb-3">
                <InputGroup.Prepend>
                    <InputGroup.Text id="basic-addon1">Compare to Cut</InputGroup.Text>
                </InputGroup.Prepend>
                    <DropdownButton
                        title={Object.keys(this.state.graph2).length === 0 ? "Select Cut" : this.state.graph2.name + " from " + this.state.graph2.dendrogramName}
                        id="input-group-dropdown-1"
                        >
                        {this.state.experts.filter(expert => expert.codebase === this.state.codebase).map(expert => <Dropdown.Item onClick={() => this.setGraph2(expert)}>{"Expert: " + expert.name}</Dropdown.Item>)}
                        <Dropdown.Divider />
                        {this.state.dendrograms.filter(dend => dend.codebase === this.state.codebase).map(dend => dend.graphs).flat().map(graph => <Dropdown.Item onClick={() => this.setGraph2(graph)}>{graph.name + " from " + graph.dendrogramName}</Dropdown.Item>)}
                    </DropdownButton>
                </InputGroup>

                <Button variant="primary" 
                        type="submit" 
                        disabled={this.state.codebase === "" || 
                                  Object.keys(this.state.graph1).length === 0 || 
                                  Object.keys(this.state.graph2).length === 0}>
                    Submit
                </Button>
                </Form>
            </div>
        )
    }
}