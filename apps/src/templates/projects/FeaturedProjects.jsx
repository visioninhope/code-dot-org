import PropTypes from 'prop-types';
import React from 'react';
import FeaturedProjectsTable from './FeaturedProjectsTable';
import {
  featuredProjectDataPropType,
  featuredProjectTableTypes,
} from './projectConstants';

export default class FeaturedProjects extends React.Component {
  static propTypes = {
    activeFeaturedProjects: PropTypes.arrayOf(featuredProjectDataPropType)
      .isRequired,
    archivedFeaturedProjects: PropTypes.arrayOf(featuredProjectDataPropType)
      .isRequired,
    savedFeaturedProjects: PropTypes.arrayOf(featuredProjectDataPropType)
      .isRequired,
  };

  render() {
    return (
      <div>
        <h3>Active Featured Projects (currently displayed in Gallery)</h3>
        <FeaturedProjectsTable
          projectList={this.props.activeFeaturedProjects}
          tableVersion={featuredProjectTableTypes.active}
        />
        <h3>Saved Featured Projects</h3>
        <FeaturedProjectsTable
          projectList={this.props.savedFeaturedProjects}
          tableVersion={featuredProjectTableTypes.saved}
        />
        <h3>Archive of Previously Featured Projects</h3>
        <FeaturedProjectsTable
          projectList={this.props.archivedFeaturedProjects}
          tableVersion={featuredProjectTableTypes.archived}
        />
      </div>
    );
  }
}
