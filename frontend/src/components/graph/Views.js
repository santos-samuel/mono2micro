import React from 'react';
import { RepositoryService } from '../../services/RepositoryService';
import { ViewsMenu, views } from './ViewsMenu';
import { ClusterView, clusterViewHelp } from './ClusterView';
import { TransactionView, transactionViewHelp } from './TransactionView';
import { EntityView, entityViewHelp } from './EntityView';
import { OverlayTrigger, Button, InputGroup, FormControl, ButtonToolbar, Popover } from 'react-bootstrap';

var HttpStatus = require('http-status-codes');

export class Views extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            graphName: this.props.match.params.name,
            inputValue: this.props.match.params.name,
            renameGraphMode: false,
            view: views.CLUSTERS,
            help: clusterViewHelp
        }

        this.handleSelectView = this.handleSelectView.bind(this);
        this.getHelpText = this.getHelpText.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleRenameGraph = this.handleRenameGraph.bind(this);
        this.handleRenameGraphSubmit = this.handleRenameGraphSubmit.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            graphName: nextProps.match.params.name,
            inputValue: nextProps.match.params.name
        });
    }

    handleSelectView(value) {
        this.setState({
            view: value,
            help: this.getHelpText(value)
        });
    }

    getHelpText(view) {
        switch(view) {
            case views.CLUSTERS:
                return clusterViewHelp;
            case views.TRANSACTION:
                return transactionViewHelp;
            case views.ENTITY:
                return entityViewHelp;
            default:
                return null;
        }
    }

    handleDoubleClick() {
        this.setState({
            renameGraphMode: true
        });
    }

    handleRenameGraph(event) {
        this.setState({ 
            inputValue: event.target.value 
        });
    }

    handleRenameGraphSubmit() {
        const service = new RepositoryService();
        service.renameGraph(this.state.graphName, this.state.inputValue).then(response => {
            if (response.status === HttpStatus.OK) {
                this.props.location.headerFunction.handleGetGraphsFunction();
                this.setState({
                    renameGraphMode: false,
                    graphName: this.state.inputValue
                });
            } else {
                this.setState({
                    renameGraphMode: false
                });
            }
        })
        .catch(error => {
            console.log(error);
            this.setState({
                renameGraphMode: false
            });
        });
    }

    handleClose() {
        this.setState({
            renameGraphMode: false,
            inputValue: this.state.graphName
        });
    }

    render() {
        const helpPopover = (
            <Popover id="popover-basic" title={this.state.view}>
              {this.getHelpText(this.state.view)}
            </Popover>
        );

        const showGraphName = (<h3>{this.state.graphName}</h3>);
        
        const editGraphName = (
            <ButtonToolbar>
                <InputGroup className="mr-1">
                    <FormControl 
                        type="text"
                        placeholder="Rename Graph"
                        value={this.state.inputValue}
                        onChange={this.handleRenameGraph}/>
                </InputGroup>
                <Button className="mr-1" onClick={this.handleRenameGraphSubmit}>Rename</Button>
                <Button onClick={this.handleClose}>Cancel</Button>
            </ButtonToolbar>);

        return (
            <div>
                <div onDoubleClick={this.handleDoubleClick}>
                    {this.state.renameGraphMode ? editGraphName : showGraphName}
                </div><br />
                <ViewsMenu
                    handleSelectView={this.handleSelectView}
                />
                <OverlayTrigger trigger="click" placement="right" overlay={helpPopover}>
                    <Button className="mb-2" variant="success">Help</Button>
                </OverlayTrigger>
                {this.state.view === views.CLUSTERS &&
                    <ClusterView name={this.state.graphName} />
                }
                {this.state.view === views.TRANSACTION &&
                    <TransactionView name={this.state.graphName} />
                }
                {this.state.view === views.ENTITY &&
                    <EntityView name={this.state.graphName} />
                }
            </div>
        );
    }
}