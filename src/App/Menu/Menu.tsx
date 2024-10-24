import React, { createElement, useMemo } from 'react';
import { capitalize } from 'lodash';
import { useSelector } from 'react-redux';
import { MenuItemLink, MenuProps, usePermissions } from 'react-admin';
import { withRouter } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Text } from '@chakra-ui/react';
import { getResourceObjects, Resource, ResourceGroup, ResourceGroupLabels } from 'src/App/Resources';

const Menu = ({ onMenuClick }: MenuProps) => {
  const permissions = usePermissions();
  const isOpen = useSelector((state) => state.admin.ui.sidebarOpen);
  const resourceRoutes = useMemo(
    () => getResourceObjects(permissions?.permissions ? permissions.permissions : permissions),
    [permissions],
  );
  const routesByResourceGroups = resourceRoutes.reduce((finalGroupedRoutes, route) => {
    if (!finalGroupedRoutes[route.group]) {
      finalGroupedRoutes[route.group] = [];
    }
    finalGroupedRoutes[route.group].push(route);
    return finalGroupedRoutes;
  }, {} as { [key in ResourceGroup]: Resource[] });

  return (
    <motion.div
      data-test="sidebar"
      hidden={!isOpen}
      initial={false}
      animate={{ width: isOpen ? '' : 0 }}
      style={{ minWidth: '280px' }}
    >
      <Accordion defaultIndex={[0, 1]} allowMultiple>
        {Object.entries(routesByResourceGroups).map(([key, routes], index) => (
          <AccordionItem borderTopWidth={index ? '1px' : '0px'}>
            <Box className="flex flex-row justify-between items-center" position={index ? '' : 'absolute'}>
              <AccordionButton width="full" pointerEvents={index ? 'auto' : 'none'} height={index ? '' : 0}>
                <Text fontWeight="bold" width="full" textAlign="left" fontFamily="Silka">
                  {ResourceGroupLabels[key]}
                </Text>
              </AccordionButton>
              {index ? <AccordionIcon mx={2} /> : null}
            </Box>
            <AccordionPanel padding={index ? '' : '0px'}>
              {routes.map(({ name, options = { label: '' }, icon, exact = false }) => (
                <MenuItemLink
                  key={name}
                  to={`/${name}`}
                  primaryText={options.label || capitalize(name)}
                  leftIcon={createElement(icon)}
                  onClick={onMenuClick}
                  sidebarIsOpen={isOpen}
                  exact={exact}
                />
              ))}
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
};

export default withRouter(Menu);
