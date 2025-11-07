import authSwagger from './auth.swagger.js';
import locationsSwagger from './locations.swagger.js';
import dishSwagger from './dish.swagger.js';
import commonSwagger from './common.swagger.js';

export default {
  ...commonSwagger,
  paths: {
    ...authSwagger.paths,
    ...locationsSwagger.paths,
    ...dishSwagger.paths,
  },
  components: {
    schemas: {
      ...commonSwagger.components?.schemas,
      ...authSwagger.components?.schemas,
      ...locationsSwagger.components?.schemas,
      ...dishSwagger.components?.schemas,
    },
  },
};