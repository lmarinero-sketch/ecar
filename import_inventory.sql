-- IMPORTACIÓN MASIVA DE INVENTARIO DESDE EXCEL

-- 1. CREAR ESTANTERIAS
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('b29bcbb0-f188-4009-a434-a5f213285f46', 'a0000000-0000-0000-0000-000000000001', 'E3', 'Estantería 3', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('560fce20-abef-4cd3-a8e4-d13c94669a46', 'a0000000-0000-0000-0000-000000000001', 'E2', 'Estantería 2', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('48ed5d2d-b392-47d7-ae5e-829b17581629', 'a0000000-0000-0000-0000-000000000001', 'E1', 'Estantería 1', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('24711631-9466-47be-a6c6-ac3ab87984cb', 'a0000000-0000-0000-0000-000000000001', 'E6', 'Estantería 6', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('4950a628-7d75-402a-a6b3-a32c5d0b2188', 'a0000000-0000-0000-0000-000000000001', 'E-1', 'Estantería -1', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('f9f2d672-039e-45d0-a839-b769ad71e1b0', 'a0000000-0000-0000-0000-000000000001', 'E5', 'Estantería 5', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('c0113f36-4d30-4b1c-abb3-138e67627339', 'a0000000-0000-0000-0000-000000000001', 'E-', 'Estantería -', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;
INSERT INTO warehouse_shelves (id, tenant_id, code, name, shelf_type, color)
VALUES ('2157d56d-6aff-408a-a90c-869526290656', 'a0000000-0000-0000-0000-000000000001', 'E4', 'Estantería 4', 'rack', '#3B82F6')
ON CONFLICT (id) DO NOTHING;

-- 2. INSERTAR MATERIALES
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2666e782-52dc-46cf-a3f3-a2b44cfabc6f', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('484d10fd-d3f0-45e4-ae3e-d827d78cad20', 'a0000000-0000-0000-0000-000000000001', 'abrazadera', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9b7e3758-fabb-4475-a059-a6e7e2241746', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera de alineacion ', 'material', '90x63', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('791de756-f9a4-4611-a24f-e3dc0f0b68ab', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera electrofusion', 'material', '115', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ef1c2f6d-1ed7-4667-aced-951bc89cdc2d', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera electrofusion', 'material', '75', 27, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('383ec2c4-d213-4eb2-a6e0-5a094502622b', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera electrofusion', 'material', '110', 6, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('59bd1d08-5891-445a-a27a-a7aa6e2137f7', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera electrofusion', 'material', '160', 11, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ef1c2f6d-1ed7-4667-aced-951bc89cdc2d', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera electrofusion', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4795bbad-ebd8-40c4-a29e-304bf91ca129', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera p/tubo', 'material', '125', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5a36b76a-9620-4bbf-a897-bcc2b8b3e473', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera p/tubo', 'material', '90', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('709e41f0-a02c-4460-aebe-2045832ecff7', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera p/tubo', 'material', '63', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('666eace9-748d-4abc-af3e-6292206ab22c', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera p/tubo', 'material', '50', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e28e454b-e012-4c59-ab8a-7924d63ddadd', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera repuestos ', 'material', '110', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C40', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c9a41053-ecb9-4a8c-ad4d-c163d05ca655', 'a0000000-0000-0000-0000-000000000001', 'Abrazadera repuestos ', 'material', '75', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C40', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8f2473f8-ec6c-45d1-aa14-be1f4d3eadc0', 'a0000000-0000-0000-0000-000000000001', 'Abrazaderas', 'material', '-', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('24b88015-622c-4fde-aa7b-f4174be2888d', 'a0000000-0000-0000-0000-000000000001', 'Aceite Compresor', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a180d7c9-4412-407c-afe7-dd704e1567a5', 'a0000000-0000-0000-0000-000000000001', 'Acon. De Combas Diesel ', 'material', 'unidad', 0, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('304f2a90-2f6b-4a62-aa6c-754925e08a23', 'a0000000-0000-0000-0000-000000000001', 'Acople rapido', 'material', '1/2', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5425ded4-b32e-43e7-af19-176e89720af9', 'a0000000-0000-0000-0000-000000000001', 'Acople rapido', 'material', '-', 0, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('63972bbd-b158-4dac-aa81-b576919649c8', 'a0000000-0000-0000-0000-000000000001', 'Acople rapido', 'material', '3/4', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('304f2a90-2f6b-4a62-aa6c-754925e08a23', 'a0000000-0000-0000-0000-000000000001', 'Acople rapido', 'material', '1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6fb56cb2-ef26-48fe-a176-c0498a4f9ff8', 'a0000000-0000-0000-0000-000000000001', 'Adaptador brida', 'material', '100', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c6d9bda4-50f4-4585-ac03-f5bebdc76168', 'a0000000-0000-0000-0000-000000000001', 'Adaptador brida', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cc2b05e9-57e5-4e8d-a8e5-9b4a51af1f8f', 'a0000000-0000-0000-0000-000000000001', 'Adaptador brida', 'material', '50', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('81208865-c82f-4f72-aec6-ae66db1f11c2', 'a0000000-0000-0000-0000-000000000001', 'Adaptador brida ', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C21', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5e3e8ae7-bbe7-4329-a1e2-fbb629a40ed3', 'a0000000-0000-0000-0000-000000000001', 'Adaptador espiga', 'material', '1/2', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('44410dd4-68df-40a3-af3f-17a73f81080c', 'a0000000-0000-0000-0000-000000000001', 'Adaptador espiga', 'material', '3/4', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f9efc749-46d6-4ca3-aef3-4ac45b764225', 'a0000000-0000-0000-0000-000000000001', 'Adhesivo de Contacto', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f9efc749-46d6-4ca3-aef3-4ac45b764225', 'a0000000-0000-0000-0000-000000000001', 'Adhesivo de Contacto', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e08e9751-404c-4051-a82a-36ab85bb769b', 'a0000000-0000-0000-0000-000000000001', 'Adhesivo PVC', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e08e9751-404c-4051-a82a-36ab85bb769b', 'a0000000-0000-0000-0000-000000000001', 'Adhesivo PVC', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('09180179-67e9-41db-abb7-942d4346ba49', 'a0000000-0000-0000-0000-000000000001', 'Adhesivo Vinilico', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('09180179-67e9-41db-abb7-942d4346ba49', 'a0000000-0000-0000-0000-000000000001', 'Adhesivo Vinilico', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('49b861fd-da3b-4b4f-a4d3-dbd42af8a0cc', 'a0000000-0000-0000-0000-000000000001', 'Aguarraz', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b2a3c867-170d-4974-a2f9-ee69e69d8e11', 'a0000000-0000-0000-0000-000000000001', 'Alambre Recocido ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9bf84b87-54f6-4694-a812-2b2e6d380870', 'a0000000-0000-0000-0000-000000000001', 'Alargue Trifasico', 'material', 'unidad', 15, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('61b79fa9-4833-4644-a11b-0422d589cfa3', 'a0000000-0000-0000-0000-000000000001', 'Alcohol', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('61b79fa9-4833-4644-a11b-0422d589cfa3', 'a0000000-0000-0000-0000-000000000001', 'Alcohol', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1b1eec90-e85d-4bc7-aec4-00436ccb96ce', 'a0000000-0000-0000-0000-000000000001', 'Alcohol en Gel', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1b1eec90-e85d-4bc7-aec4-00436ccb96ce', 'a0000000-0000-0000-0000-000000000001', 'Alcohol en Gel', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('10c2ca65-8f47-472d-aeb2-fb509f7f0cc1', 'a0000000-0000-0000-0000-000000000001', 'Antideslizante', 'material', '-', 12, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d5e43949-2a67-481c-a2a1-c61dbb0d6bdc', 'a0000000-0000-0000-0000-000000000001', 'Antioxido', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d5e43949-2a67-481c-a2a1-c61dbb0d6bdc', 'a0000000-0000-0000-0000-000000000001', 'Antioxido', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5aeb3577-864e-48f9-a4e6-be08e8f4d202', 'a0000000-0000-0000-0000-000000000001', 'Aparejo Elec', 'material', '1600w', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N3-C83', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a03464a8-0836-40ca-abb7-e01456ef42ad', 'a0000000-0000-0000-0000-000000000001', 'Aplique para foco tortuga ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e6899842-1b0a-435c-a009-eb65a1775b87', 'a0000000-0000-0000-0000-000000000001', 'Arandelas', 'material', 'caja', 3, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('00685ddf-eb04-4067-a644-6bf17b2bcf89', 'a0000000-0000-0000-0000-000000000001', 'Arnes de Anticaida', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('00685ddf-eb04-4067-a644-6bf17b2bcf89', 'a0000000-0000-0000-0000-000000000001', 'Arnes de Anticaida', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('00685ddf-eb04-4067-a644-6bf17b2bcf89', 'a0000000-0000-0000-0000-000000000001', 'Arnes de Anticaida', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8a24f4fe-a1c9-401c-a9a3-40216a04ae39', 'a0000000-0000-0000-0000-000000000001', 'Aro base de inodoro', 'material', '80', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3c349621-ce7e-4376-a6e6-dccb405c0832', 'a0000000-0000-0000-0000-000000000001', 'Art. De limpieza', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N3-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5fa50149-54ee-495b-ae27-897153ef6abd', 'a0000000-0000-0000-0000-000000000001', 'Banda Acustica ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('60178326-5121-44d8-ab1a-bdacc9e76216', 'a0000000-0000-0000-0000-000000000001', 'Banda Negra  ', 'material', 'unidad', 1, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b8397a82-8c85-41de-a3b8-17cfb07a4bbc', 'a0000000-0000-0000-0000-000000000001', 'Bandera Roja ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c177f83e-0936-46d8-a215-a5d3855f229d', 'a0000000-0000-0000-0000-000000000001', 'Barbijos ', 'material', 'unidad', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c177f83e-0936-46d8-a215-a5d3855f229d', 'a0000000-0000-0000-0000-000000000001', 'Barbijos ', 'material', 'unidad', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0344772d-9654-4cb7-a515-4641c5d64550', 'a0000000-0000-0000-0000-000000000001', 'Barilla Enroscada', 'herramienta', '12mm', 1, NULL, NULL, 'Pasillo 1 (Fondo)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('932494e6-d21d-4bc5-a7ae-1b9175946ac4', 'a0000000-0000-0000-0000-000000000001', 'Barniz ', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('932494e6-d21d-4bc5-a7ae-1b9175946ac4', 'a0000000-0000-0000-0000-000000000001', 'Barniz ', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2b3aa929-412a-4df9-ab38-9c874c8cb4e0', 'a0000000-0000-0000-0000-000000000001', 'Barra Empujadora ', 'material', 'unidad', 2, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2b3aa929-412a-4df9-ab38-9c874c8cb4e0', 'a0000000-0000-0000-0000-000000000001', 'Barra Empujadora ', 'material', 'unidad', 2, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dcade7f5-93fb-4215-ae85-0434f02af9bd', 'a0000000-0000-0000-0000-000000000001', 'Bastidor para embutir', 'material', '-', 72, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C49', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('17af8614-f2ee-4dd2-a00c-f27cc2a3c069', 'a0000000-0000-0000-0000-000000000001', 'Bateria Linterna ', 'material', '6v', 4, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8bd996b4-eeb3-4a3f-a72c-3530bb73191f', 'a0000000-0000-0000-0000-000000000001', 'Bisagra alce', 'material', '-', 8, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f72d664f-0fde-4d86-a355-d1804266e62e', 'a0000000-0000-0000-0000-000000000001', 'Bisagras mueble incompletas', 'material', '-', 18, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C45', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b72e24f8-0539-4756-a28e-bb4b71975c38', 'a0000000-0000-0000-0000-000000000001', 'Bisagras pomela ', 'material', '-', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2ab728b5-fa71-4b6f-a35a-7488b7b1de87', 'a0000000-0000-0000-0000-000000000001', 'Bisagras pomela incompletas', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f98cc824-de4d-4d3f-a5d9-45b04e85d71e', 'a0000000-0000-0000-0000-000000000001', 'Blades de Albañil', 'material', 'unidad', 4, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('feab5d39-8f1a-4072-afc3-2dd82b8a95d4', 'a0000000-0000-0000-0000-000000000001', 'Boca de Patio', 'material', '110x3', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C44', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0412829c-239f-4bcc-ab9b-ad92bd56f43d', 'a0000000-0000-0000-0000-000000000001', 'Boca techo c/3 conectores ', 'material', '20m', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ef792efa-6e8b-41b1-a77d-2716fe21e710', 'a0000000-0000-0000-0000-000000000001', 'Bolsas de Residuos ', 'material', 'unidad', 3, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N3-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fa42d277-d571-4d90-a69c-8faf793c7859', 'a0000000-0000-0000-0000-000000000001', 'Bomba de Vacio Indu ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0cd6b5b3-51ad-4a18-a2b8-9f99aee1cd66', 'a0000000-0000-0000-0000-000000000001', 'Bombas de agua ', 'material', '1HP', 2, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N3-C82', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0cd6b5b3-51ad-4a18-a2b8-9f99aee1cd66', 'a0000000-0000-0000-0000-000000000001', 'Bombas de agua ', 'material', '1HP', 6, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N3-C82', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('38d42944-8961-4a2a-ac60-7e4e5548837b', 'a0000000-0000-0000-0000-000000000001', 'Boya inodoro', 'material', '-', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('168ef840-6c37-4f1c-add2-f6a71c71e212', 'a0000000-0000-0000-0000-000000000001', 'Brida de fundicion ', 'material', '180mm', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C67', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c9b840c0-c482-489b-a381-b4494c309971', 'a0000000-0000-0000-0000-000000000001', 'Brida de fundicion ', 'material', '125mm', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C67', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fa4fbeb8-8de6-4893-a319-03ab6d16670e', 'a0000000-0000-0000-0000-000000000001', 'Brida de fundicion ', 'material', '90mm', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C67', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d0189771-e56f-470c-a0e0-78b9e0588014', 'a0000000-0000-0000-0000-000000000001', 'Brida de fundicion ', 'material', '50mm', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C67', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3eba900e-21cd-4718-ab3d-f93459729f30', 'a0000000-0000-0000-0000-000000000001', 'Brida de fundicion ', 'material', '40mm', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C67', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2861da3e-b507-4c4e-aec6-ce644d6b2b59', 'a0000000-0000-0000-0000-000000000001', 'Brida termofusion', 'material', '65', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('51e61eb8-125b-4eb9-adb7-9c0d93188d80', 'a0000000-0000-0000-0000-000000000001', 'Brida termofusion', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c29b3a17-d6b4-4836-aa85-a59ea510ffca', 'a0000000-0000-0000-0000-000000000001', 'Buje de Reduc 3p a 2p', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('249a390e-67a0-457f-a578-d7b6e91c5c48', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion', 'material', '3/4 a 1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('17175b01-0bfd-4a5e-a141-8468bf47d003', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion ', 'material', '29x 3/4', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('34691a7e-0c12-4248-a30c-eece98d0f2bc', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '25x17', 13, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a9dbd4cc-affa-45ee-a7c6-ed18235bbdb1', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '2x1 1/4', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('017070b8-4f8b-4918-aed7-e87a38001537', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '47x18', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6dfa7069-2023-4a74-aa8b-51f108f2a394', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '50x31', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('af4d88b6-5d6f-4707-a921-3e6c56ba5994', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '30x18', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b2cb1799-00ab-4ab9-a22f-594b13fc55f5', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '50x30', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('af4d88b6-5d6f-4707-a921-3e6c56ba5994', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '30x18', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5fd017e6-9764-4f36-a7b6-ac11250a7940', 'a0000000-0000-0000-0000-000000000001', 'Buje reduccion epoxi', 'material', '25x30', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('aa833111-ec32-4003-a9a0-6b132322516d', 'a0000000-0000-0000-0000-000000000001', 'Burlete felpa ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('239bee9a-2eca-4a03-a4fc-aac9f4f8a4fb', 'a0000000-0000-0000-0000-000000000001', 'Busca polo Inductor ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('13cc3229-ae3f-41c4-a60f-63d99424ccc2', 'a0000000-0000-0000-0000-000000000001', 'Cabezal Montable', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a600acfc-d0bd-4d57-a28a-81b275ce4455', 'a0000000-0000-0000-0000-000000000001', 'Cabla taller', 'material', '2,5mm', 10, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('72f3644b-5c5f-43b7-a1ee-268f413cc7fd', 'a0000000-0000-0000-0000-000000000001', 'Cable c/celeste', 'material', '1x1,5', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f34da375-d62e-4f77-a341-f179d0e36fb5', 'a0000000-0000-0000-0000-000000000001', 'Cable c/celeste', 'material', '1x2,5', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3687c8c3-dcdd-40f3-ae29-15a57b17bd94', 'a0000000-0000-0000-0000-000000000001', 'Cable c/marron', 'material', '1x2,5', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dc482408-cc51-4321-aa73-1ff9028a5a64', 'a0000000-0000-0000-0000-000000000001', 'Cable c/verde', 'material', '1x2,5', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c8830e52-4705-4d34-aa94-a11d813fc721', 'a0000000-0000-0000-0000-000000000001', 'Cable p/ Alargue ', 'material', '3x2', 6, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1ece5eed-2564-4e80-a3ba-664a634fb5f3', 'a0000000-0000-0000-0000-000000000001', 'Cable p/ Alargue ', 'material', '7x1mm', 33, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bcb055ce-17e1-468b-ab46-1ef6e60bf654', 'a0000000-0000-0000-0000-000000000001', 'Cable Puente', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('de08bd26-04d9-48d1-affc-b5d0afb83e0f', 'a0000000-0000-0000-0000-000000000001', 'Cable Trifasico ', 'material', '100', 9, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N2-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6b2aee27-7441-45f9-aff1-53c49a905d9b', 'a0000000-0000-0000-0000-000000000001', 'Cadena  ', 'material', '-', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3d3b64e5-efc0-43f0-a381-22e865ebebdf', 'a0000000-0000-0000-0000-000000000001', 'Cadena p/ moto/ bici', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('64998cff-c91a-4ec1-a39d-1e6e17008807', 'a0000000-0000-0000-0000-000000000001', 'Cadena Tranqueta', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1ee96b31-b329-4484-a1c0-a6b49db21f76', 'a0000000-0000-0000-0000-000000000001', 'Caja Aguirre', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N3-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('feca61f2-e900-40c6-a6c0-4415c8ff6361', 'a0000000-0000-0000-0000-000000000001', 'Caja c/ herramientas varias ', 'material', 'unidad', 2, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N3-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ed9c963a-2efc-42da-a88e-96e4c765c115', 'a0000000-0000-0000-0000-000000000001', 'Caja c/ Planchuelas ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3714c5a6-8de4-40c6-a219-5ac91bde60f0', 'a0000000-0000-0000-0000-000000000001', 'Caja c/ ropa ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N3-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0c31578c-362f-436d-aa04-3c4f69bf2080', 'a0000000-0000-0000-0000-000000000001', 'Caja con Recortes de aluminio', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N3-C82', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8ad3c68d-b4cb-4333-a3d3-24c4724716e1', 'a0000000-0000-0000-0000-000000000001', 'Caja de embutir', 'material', '8x7', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C60', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0c1a8fe8-c8fa-4da7-a23d-0f14df5cb777', 'a0000000-0000-0000-0000-000000000001', 'Caja de embutir', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a6e80002-e6d8-44b1-adc0-137539657552', 'a0000000-0000-0000-0000-000000000001', 'Caja de embutir octogonal ', 'material', '10x10', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C60', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('14cee120-4df6-41e0-a4a4-10b75f3aaf1c', 'a0000000-0000-0000-0000-000000000001', 'Caja de embutir rectangular ', 'material', '5x10', 26, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C60', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5b2d9add-2bfb-4907-a39c-3c897340bf95', 'a0000000-0000-0000-0000-000000000001', 'Caja de embutiroctagonal ', 'material', '9x9', 14, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C60', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0394ebcf-961a-498b-a534-fce36f3f1798', 'a0000000-0000-0000-0000-000000000001', 'Caja de inspeccion', 'material', '15x15', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('836e7f16-b5f6-4d00-aafa-8a205c71ee38', 'a0000000-0000-0000-0000-000000000001', 'Caja p/ Termica Externa ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('746b2c11-1149-4adc-a698-a05b56aa0066', 'a0000000-0000-0000-0000-000000000001', 'Calibre Digital ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1788e53f-a016-4910-a273-8da16a048053', 'a0000000-0000-0000-0000-000000000001', 'Campanilla/timbre ', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C45', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8ff7e99d-00ae-498e-af66-42163da54ddd', 'a0000000-0000-0000-0000-000000000001', 'cañamo', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('45271eaf-7677-4ba2-a99b-b75639d903e0', 'a0000000-0000-0000-0000-000000000001', 'Caño de Aluminio', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7ffceb26-c648-490c-a92e-df9113e62adf', 'a0000000-0000-0000-0000-000000000001', 'Caño de Cobre c/ Rosca ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7ffceb26-c648-490c-a92e-df9113e62adf', 'a0000000-0000-0000-0000-000000000001', 'Caño de Cobre c/ Rosca ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dbedaf4f-f02b-47a8-adbf-aeed65c86e47', 'a0000000-0000-0000-0000-000000000001', 'Capacitor', 'material', '450-500uF', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('831cb66d-fde4-4a56-a673-1a7ca94a47f8', 'a0000000-0000-0000-0000-000000000001', 'Cargador ', 'material', '12v ', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('36fe9ded-1276-4c28-abac-b0bb601fe4c6', 'a0000000-0000-0000-0000-000000000001', 'Cargador ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9b74730e-c029-4712-ac92-1b8263263a48', 'a0000000-0000-0000-0000-000000000001', 'Cargador Einhell', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7d9dc5d1-92ca-471b-a660-6b59e4f133d5', 'a0000000-0000-0000-0000-000000000001', 'Casco Blanco', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('28cda655-dd83-470f-a99e-06f455808aff', 'a0000000-0000-0000-0000-000000000001', 'Cerradura ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('28cda655-dd83-470f-a99e-06f455808aff', 'a0000000-0000-0000-0000-000000000001', 'Cerradura ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d7235765-026b-4897-afe0-5b22e1c36ba5', 'a0000000-0000-0000-0000-000000000001', 'Cerradura p/exterior', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2c96bbdc-0092-4785-a6c4-a043b1a9270b', 'a0000000-0000-0000-0000-000000000001', 'Cerradura sin llave', 'material', '-', 9, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('067484b6-92da-464e-a368-f0dd77eedbe5', 'a0000000-0000-0000-0000-000000000001', 'Cerrucho ', 'material', 'unidad', 2, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N2-C1', 'Pasillo 1 Izq ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4be700cd-394f-4972-af35-2eff4f759291', 'a0000000-0000-0000-0000-000000000001', 'Chaleco Reflactante ', 'material', 'unidad', 9, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4be700cd-394f-4972-af35-2eff4f759291', 'a0000000-0000-0000-0000-000000000001', 'Chaleco Reflactante ', 'material', 'unidad', 9, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e0b0772d-e5f8-413a-a729-7237bc8cd6a3', 'a0000000-0000-0000-0000-000000000001', 'Cinta Aluminio', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e4baac43-f824-4088-a8ae-d8417393fa25', 'a0000000-0000-0000-0000-000000000001', 'Cinta anticorrosiva', 'material', '4', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C31', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c7464b79-62d6-400e-a209-56db7cba6f00', 'a0000000-0000-0000-0000-000000000001', 'Cinta de Amarre c/ Crique ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c7464b79-62d6-400e-a209-56db7cba6f00', 'a0000000-0000-0000-0000-000000000001', 'Cinta de Amarre c/ Crique ', 'material', 'unidad', 5, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9fe12b16-e78e-410f-af87-74cfb2fb590b', 'a0000000-0000-0000-0000-000000000001', 'Cinta de Juntas ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c5ab8be2-5e0c-4e98-a4ca-158d37936835', 'a0000000-0000-0000-0000-000000000001', 'Cinta matly autoadesiva', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('aeef8f9a-7b7c-4f45-acf6-e4c55981fd15', 'a0000000-0000-0000-0000-000000000001', 'Cinta Peligro', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C73', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('972d8142-8696-4783-a7ad-0e7c424eb6a6', 'a0000000-0000-0000-0000-000000000001', 'Cinta Tramada ', 'material', '50mmx90m', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('09c88a2b-eb8e-4dc3-a956-2668e0940309', 'a0000000-0000-0000-0000-000000000001', 'Cinta Trasparente ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f8a83d6d-dbfc-46a0-a05d-fbe11502eca9', 'a0000000-0000-0000-0000-000000000001', 'Cinturon de Seguridad 1 pun', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b1adbace-8b75-4e82-ad3d-2dfaafb1dfb7', 'a0000000-0000-0000-0000-000000000001', 'Cinturon de Seguridad 2 Pun ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1e2f8cd0-e58a-4217-aaee-6748338a1b7e', 'a0000000-0000-0000-0000-000000000001', 'Cizalla p/ cortar Hierra ', 'material', '2p', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C84', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bc711c62-1b2b-4056-aa55-810ede44ac32', 'a0000000-0000-0000-0000-000000000001', 'Codo', 'material', '160', 5, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C41', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('41635a63-6c35-4483-a06c-234f0d7820cf', 'a0000000-0000-0000-0000-000000000001', 'Codo', 'material', '90º H-H', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cacd331b-c6db-43c6-a612-7f5801706e8c', 'a0000000-0000-0000-0000-000000000001', 'Codo 63', 'material', 'unidad', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C18', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cacd331b-c6db-43c6-a612-7f5801706e8c', 'a0000000-0000-0000-0000-000000000001', 'Codo 63', 'material', 'unidad', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C18', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('aa05df50-d4ad-41a1-afe9-84ba21f54acd', 'a0000000-0000-0000-0000-000000000001', 'Codo ', 'material', '1', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C31', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6b6782d3-aed6-4222-a96b-2d6d80f64577', 'a0000000-0000-0000-0000-000000000001', 'Codo ', 'material', '1', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('95aff5f7-86bb-42e7-a89f-84dafe259d1b', 'a0000000-0000-0000-0000-000000000001', 'Codo ', 'material', '3/4', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7335b985-f00c-453c-ac89-2eec3fcb0569', 'a0000000-0000-0000-0000-000000000001', 'Codo ', 'material', '25', 14, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('62db3079-5979-4fcc-a62f-1fd42f2d1466', 'a0000000-0000-0000-0000-000000000001', 'Codo ', 'material', '1 x 1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d031d7e7-3237-4fc0-ad73-53047dfe9536', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi', 'material', '20', 31, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('17b1b6a8-60e8-49e4-a698-c49282a5c362', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi', 'material', '25', 6, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0116b2d9-f85c-463d-a296-d5d5947d8ae8', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi', 'material', '1 x 1/2', 9, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e69069c3-c461-4c69-a967-001dffd41e68', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi', 'material', '1 x 1/4', 11, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6c88f064-a4d5-48a2-a25f-fa3a3ad26d42', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi', 'material', '2', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bc642780-c62a-47df-a3cd-9441f4a36d38', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi', 'material', '1', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a7cd893a-721b-4303-a43b-8381794f4325', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi macho/ hembra', 'material', '1 x 1/4', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('39bc5c06-277c-42b6-afc2-72ab240bc9c7', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi macho/ hembra', 'material', '1 x 1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e8c4f321-72f8-4f15-aaf1-67ee791d1ac6', 'a0000000-0000-0000-0000-000000000001', 'Codo macho hembra', 'material', '3/4', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('96b78137-667e-49e9-ad2b-dfe35db0d2e3', 'a0000000-0000-0000-0000-000000000001', 'Codo macho termofusion', 'material', '3/4', 17, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dea0bee1-e760-4263-a481-a4a4fa4e2159', 'a0000000-0000-0000-0000-000000000001', 'Codo macho termofusion', 'material', '3/4 x 1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('753747bb-f234-4f41-a419-fa68baabe162', 'a0000000-0000-0000-0000-000000000001', 'Codo macho termofusion', 'material', '3/4 x 1', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('166b6dc7-bc2d-4a9f-ac3c-6912693553c6', 'a0000000-0000-0000-0000-000000000001', 'Codo con inserto ', 'material', '25', 19, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('caf20280-5e49-4a02-a67f-996485edbf6d', 'a0000000-0000-0000-0000-000000000001', 'Codo con inserto ', 'material', '20', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bb5133b3-8499-4543-ab74-a22ec727b941', 'a0000000-0000-0000-0000-000000000001', 'Codo electrofusion', 'material', '110', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d32c6ae5-cba4-437d-a471-458f9a754665', 'a0000000-0000-0000-0000-000000000001', 'Codo electrofusion', 'material', '75', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d32c6ae5-cba4-437d-a471-458f9a754665', 'a0000000-0000-0000-0000-000000000001', 'Codo electrofusion', 'material', '75', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6f53d89a-d4d4-43f9-a049-c8b26bfc2dd4', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi 90', 'material', '100', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8f6c2bc7-bd4e-46a0-af05-cec219a1c8cf', 'a0000000-0000-0000-0000-000000000001', 'Codo epoxi 90', 'material', '70', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1f7c6acc-f82d-495d-a61a-661791ce7781', 'a0000000-0000-0000-0000-000000000001', 'Codo Gal.', 'material', '2p', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8bb2ac50-a491-40a7-a566-671c2b033ed7', 'a0000000-0000-0000-0000-000000000001', 'Codo H-H', 'material', '50', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C39', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9bbb67ab-3f00-4763-ad07-666fb65e909d', 'a0000000-0000-0000-0000-000000000001', 'Codo H-H', 'material', '110', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C42', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('456f9628-71d2-409d-adf4-9c8de9f42928', 'a0000000-0000-0000-0000-000000000001', 'Codo inserto termofusion ', 'material', '25', 19, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6fcd5cc3-ef58-49ac-aae4-92ecc365c6b7', 'a0000000-0000-0000-0000-000000000001', 'Codo inserto termofusion ', 'material', '20', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('58777f20-6f7d-4dad-a1ea-9a060612f914', 'a0000000-0000-0000-0000-000000000001', 'Codo macho termofusion', 'material', '1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('902220a3-7313-4c06-a08b-437dd4f48d0a', 'a0000000-0000-0000-0000-000000000001', 'Codo M-H', 'material', '110', 2, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C42', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8875b582-3be4-4275-a732-3b62f815d2ea', 'a0000000-0000-0000-0000-000000000001', 'Codo M-H', 'material', '20mm', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('07b0e30a-a79e-499c-a790-aefaef36b8b7', 'a0000000-0000-0000-0000-000000000001', 'Codo termofusion', 'material', '90', 36, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6cba388e-03d5-46d0-ad3a-5cbdf828f1fd', 'a0000000-0000-0000-0000-000000000001', 'Codo termofusion', 'material', '45', 9, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f055e4a9-16b8-4bcd-a9a6-f4880dbdc493', 'a0000000-0000-0000-0000-000000000001', 'Codo termofusion', 'material', '20', 20, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2bfeaee8-a5cd-403f-a1ea-2965dd27921c', 'a0000000-0000-0000-0000-000000000001', 'Codo termofusion', 'material', '25', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a398160b-c8ba-4bec-ae18-e1673949d029', 'a0000000-0000-0000-0000-000000000001', 'Codo termofusion', 'material', '20', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fe4fb20f-9bdd-4ba5-a200-1b9d9a322a8b', 'a0000000-0000-0000-0000-000000000001', 'Codo termofusion ', 'material', '32', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b90235b0-0b55-4dbd-af52-4a21a934de68', 'a0000000-0000-0000-0000-000000000001', 'codo termofusion 45', 'material', '20', 9, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c053794d-5386-4ff5-ad7e-34601c8aa505', 'a0000000-0000-0000-0000-000000000001', 'Codo termofusion 90', 'material', '25', 36, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ead20164-eba0-4d74-a303-c11300a8046d', 'a0000000-0000-0000-0000-000000000001', 'Conector', 'material', '20', 40, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C55', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b202e84c-93e5-4bfc-a9fc-608179d04ba1', 'a0000000-0000-0000-0000-000000000001', 'Conector ', 'material', '12', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b202e84c-93e5-4bfc-a9fc-608179d04ba1', 'a0000000-0000-0000-0000-000000000001', 'Conector ', 'material', '12', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('afcdffeb-7bd7-4264-af06-a335b170c1aa', 'a0000000-0000-0000-0000-000000000001', 'Conector chapa ', 'material', '20', 23, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('82f6dbd1-4642-4400-ac75-8945bb530e9c', 'a0000000-0000-0000-0000-000000000001', 'Conector chapa ', 'material', '14', 16, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fecb6a35-0036-4e7d-a8cb-2e270280dd47', 'a0000000-0000-0000-0000-000000000001', 'Conector para inodoro inoxidable', 'material', '-', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('43c8af15-7566-49a3-aaa8-5217d3f2163a', 'a0000000-0000-0000-0000-000000000001', 'Conector union ', 'material', '-', 12, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8c4ce42c-c033-4111-a9f6-402ae8a2de51', 'a0000000-0000-0000-0000-000000000001', 'Conexión de tanque ', 'material', '1/2', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3e8b949e-c5d6-4f20-acb6-726eb571cca8', 'a0000000-0000-0000-0000-000000000001', 'Conexión de tanque ', 'material', '1', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('826c8ac5-11d7-4d42-ae6e-9492a86c3b12', 'a0000000-0000-0000-0000-000000000001', 'Contact', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C63', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1d653a03-ba88-46cb-a13a-3e839311bd94', 'a0000000-0000-0000-0000-000000000001', 'Correa Trapezoidal ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C76', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1d653a03-ba88-46cb-a13a-3e839311bd94', 'a0000000-0000-0000-0000-000000000001', 'Correa Trapezoidal ', 'material', 'unidad', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C76', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('344d777c-87da-41b6-a7f8-d4846503d2fc', 'a0000000-0000-0000-0000-000000000001', 'Corrredera', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('47ad68f2-02dd-41c8-a39f-9bf384e7b860', 'a0000000-0000-0000-0000-000000000001', 'Corrugado ', 'material', '10', 5, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N1-C1', 'estante de arriba ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6fd7ec1d-37ad-4e16-a674-381216c2b1b3', 'a0000000-0000-0000-0000-000000000001', 'Corrugado ', 'material', '8', 5, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2992bcce-1e9c-4076-a54a-ed8f67e0b23b', 'a0000000-0000-0000-0000-000000000001', 'Corrugado ', 'material', '20', 5, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9eec9749-fdb4-4ef3-ad29-340b4f4659bd', 'a0000000-0000-0000-0000-000000000001', 'Corrugado ', 'material', '25', 5, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('71b75780-4062-4db9-ac58-7823fbb8d721', 'a0000000-0000-0000-0000-000000000001', 'Corta Fierro demoledor ', 'material', 'unidad', 2, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c8438056-5179-4d49-af27-47bd37f57417', 'a0000000-0000-0000-0000-000000000001', 'Cortadora de caños 1/2-2p', 'herramienta', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e2c7e623-6e7e-4753-aac1-6dbce5f17d29', 'a0000000-0000-0000-0000-000000000001', 'Cortadora de caños 2p ', 'herramienta', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3ea656a9-4687-474b-a455-ea286613835a', 'a0000000-0000-0000-0000-000000000001', 'Cortadora de Ceramica ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('56965dce-c1f5-491f-a61d-607af8f84624', 'a0000000-0000-0000-0000-000000000001', 'Cortadora p/ maquina de term sell ', 'material', '-', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d242dc84-59fc-45f9-ac27-c5b98cc3a8b9', 'a0000000-0000-0000-0000-000000000001', 'Criquet ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ecec4d7b-a652-4b91-a8e9-b97963ff9415', 'a0000000-0000-0000-0000-000000000001', 'Cruz epoxi', 'material', '50', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('495b279a-d7b0-48a0-a47f-49b3f707ebc5', 'a0000000-0000-0000-0000-000000000001', 'Cuello Ortopedico ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('495b279a-d7b0-48a0-a47f-49b3f707ebc5', 'a0000000-0000-0000-0000-000000000001', 'Cuello Ortopedico ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b2ddd5f0-5611-4431-a300-e04c56b77a5b', 'a0000000-0000-0000-0000-000000000001', 'Cuña Extractora ', 'material', '-', 6, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('95b27989-8b1c-4cd5-a415-649068e9df3d', 'a0000000-0000-0000-0000-000000000001', 'Cupla', 'material', '50', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0d1840f2-cdb7-4150-a86c-d17d86c2c035', 'a0000000-0000-0000-0000-000000000001', 'Cupla ', 'material', '110', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C39', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1ff27871-9280-4d8b-a808-fe0f4bf7c1f5', 'a0000000-0000-0000-0000-000000000001', 'Cupla ', 'material', '20', 5, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C55', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dabd081d-da6d-44a1-a49d-6d430d6ac86a', 'a0000000-0000-0000-0000-000000000001', 'Cupla 63', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dabd081d-da6d-44a1-a49d-6d430d6ac86a', 'a0000000-0000-0000-0000-000000000001', 'Cupla 63', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ee28b2c2-1972-4c94-a87d-240ca0a56ccb', 'a0000000-0000-0000-0000-000000000001', 'Cupla c/rosca ', 'material', '3', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C39', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c83a8800-cc20-4cbe-a9d9-305be1cfeb47', 'a0000000-0000-0000-0000-000000000001', 'cupla chapa', 'material', '1/2', 34, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('29d9a2c1-847d-40f7-aa45-1a958fd6e1d5', 'a0000000-0000-0000-0000-000000000001', 'cupla chapa', 'material', '3/4', 3, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('05a71c33-0821-466d-a855-64ef9caf763f', 'a0000000-0000-0000-0000-000000000001', 'Cupla chapa ', 'material', '3/4', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('08ca9e6b-ea19-4820-a8fb-7bd4c67e3cce', 'a0000000-0000-0000-0000-000000000001', 'Cupla cromada ', 'material', '3', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C31', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b16551c0-99ae-4012-ac86-eda319bc0a87', 'a0000000-0000-0000-0000-000000000001', 'Cupla cromada ', 'material', '2', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C31', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5540f2e0-d23e-464b-a640-66802f3ca710', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion', 'material', '110', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C18', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e36f85a1-2bc3-4604-a3ec-09f77ee346f0', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '32', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4e937e26-bd20-4b4e-a0da-c814e8690dcb', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '25', 36, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7d307c65-9a6d-43d1-a139-9eb3e0e2accb', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '110', 13, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8a744866-0b7a-4ce4-aa5c-544b76f9f581', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '75', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f1f93945-c968-40d1-af79-361077d02dc0', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '160', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c6514aea-6447-41ac-aebc-6c2d5c085871', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '63', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C8', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f4231b51-db76-4de6-a2d9-114bfa4d27d6', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '50', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C9', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0aced718-b381-4508-a041-ed8c7883069a', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '90', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f1f93945-c968-40d1-af79-361077d02dc0', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '160', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0aced718-b381-4508-a041-ed8c7883069a', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '90', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f1f93945-c968-40d1-af79-361077d02dc0', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion ', 'material', '160', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('45a34740-02b0-4a45-afbc-c074be9ecdbf', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion T', 'material', '50', 21, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C10', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c9cb9776-3f4f-43f2-ade8-9fa55447d7dc', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion T', 'material', '90', 15, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6d1ff2d7-04bd-4eb5-af75-cb01d268d902', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion T', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e968d39a-bf5d-4264-af61-a3eb2ca0c6e5', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion T', 'material', '63', 14, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C14', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c9cb9776-3f4f-43f2-ade8-9fa55447d7dc', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion T', 'material', '90', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6d1ff2d7-04bd-4eb5-af75-cb01d268d902', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion T', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d18251ac-41d5-4137-adbd-1f9cfab7002a', 'a0000000-0000-0000-0000-000000000001', 'Cupla electrofusion T', 'material', '63x63x63', 15, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C14', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b355192c-cc9d-46ee-ab7d-5fad6767cbfb', 'a0000000-0000-0000-0000-000000000001', 'Cupla enroscada ', 'material', '3/4', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('88c63ef9-4651-4c92-ac3d-44aa83cb0753', 'a0000000-0000-0000-0000-000000000001', 'Cupla enroscada ', 'material', '1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9498563e-9984-40b4-ab48-28e1fa8c50c6', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi', 'material', '90', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7409ec25-724e-4e97-a4a6-fe1d323edc66', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi', 'material', '75', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c774e0c6-9dc7-4dc5-a7d2-9214dbc8ba52', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi', 'material', '100', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f8eb5fd3-35cd-473a-a506-5854626b0d60', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi', 'material', '1 1/2', 13, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a385e32b-0176-4f0d-a514-b64af795f098', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi', 'material', '1 1/4', 8, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a6c59ad7-ce16-49e7-a22b-148993b11f1a', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi', 'material', '46', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a1ed895d-dc2d-4d80-ad27-541a78d3cf72', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi', 'material', '3/4', 36, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fdb94d44-b0af-44f7-a7db-8cc8d8a8824e', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi ', 'material', '38', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('564a504a-2b8d-4458-a4dc-a444fd28f5b3', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi ', 'material', '30', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('564a504a-2b8d-4458-a4dc-a444fd28f5b3', 'a0000000-0000-0000-0000-000000000001', 'Cupla epoxi ', 'material', '30', 32, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5ce04e39-47c2-4398-a1ba-ed823d6147f9', 'a0000000-0000-0000-0000-000000000001', 'Cupla PVC ', 'material', '105', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('678cd9fb-3689-46f1-a544-d151aef8ac15', 'a0000000-0000-0000-0000-000000000001', 'Cupla PVC ', 'material', '86', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('00198f75-9e7b-451c-a82b-1fed7e45da0a', 'a0000000-0000-0000-0000-000000000001', 'Cupla PVC ', 'material', '160', 2, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C44', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('94d28dfa-1867-454d-a9ba-e19f88bb7581', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '40', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('06eb485f-ec38-4c11-a0d4-67f2225f0dde', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '1/2', 22, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2f9a28ef-dbb9-4a88-af78-36a26cc70913', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '1 1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('995e485f-a387-440b-a944-ba44728dbd2f', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '1', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('905bbbdb-d7e7-4225-a4d2-0469121d1a0a', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '40', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('281d7388-8126-4748-a2fd-19a0f4113970', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '32', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4b2f5271-85de-4980-adb8-7ed146bfed3b', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '32x25x32', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2440d1ba-5696-4559-acfa-a1773d0d85b0', 'a0000000-0000-0000-0000-000000000001', 'Cupla T', 'material', '32x20x32', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c838d37a-2baf-4d8a-a210-69b62deb210a', 'a0000000-0000-0000-0000-000000000001', 'Cupla T ', 'material', '3/4', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3b112e23-eaa1-4d7c-aee7-fed895be0432', 'a0000000-0000-0000-0000-000000000001', 'Cupla T con inserto', 'material', '25 x3/4', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d1229778-e637-451f-af79-9b3234c68c85', 'a0000000-0000-0000-0000-000000000001', 'Cupla T con inserto', 'material', '3/4', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6cd3da56-8bb1-414c-aefb-dad7f253e400', 'a0000000-0000-0000-0000-000000000001', 'Cupla T cromada ', 'material', '1', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C31', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e0b9a48a-38b5-4361-aff1-250b84a8068b', 'a0000000-0000-0000-0000-000000000001', 'Cupla T epoxi', 'material', '2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f4a8d175-65ae-45ab-ae5e-f34a10984527', 'a0000000-0000-0000-0000-000000000001', 'Cupla T epoxi', 'material', '1 x 1/2', 6, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c13aad78-759b-42f9-acc1-63e3f1350b0d', 'a0000000-0000-0000-0000-000000000001', 'Cupla T termofusion', 'material', '20', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ca38c348-b17a-42d8-ade2-30b371614f80', 'a0000000-0000-0000-0000-000000000001', 'Cupla T termofusion', 'material', '25', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e22323bf-7b99-419e-a57a-5c447e74e54d', 'a0000000-0000-0000-0000-000000000001', 'Cupla T termofusion', 'material', '20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f7a1771e-a4ef-42c1-a637-9f7bc93ed692', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '50', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('69dcf223-e864-4ebe-a19f-488e7e3bb000', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0a707a4c-25ba-45c1-a3e9-6edfda991e67', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '20', 10, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('98b2452c-7f44-4007-a603-cc8869a92e2c', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '25', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a00abef7-2068-4ac7-a8e4-ef460fb8020a', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '32', 8, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f8c83083-c4ea-4522-a998-4301b16d69c7', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '40', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6fc71090-1991-4ae4-a173-a3deefdc7bf3', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '20', 9, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('92e7c39a-1e15-4f0c-a260-51e0b9042371', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '32', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f4b1bc51-54ec-45c1-aedd-809facbe7312', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion', 'material', '25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('582bfa3d-69ac-4838-a5d8-32b1b249c0a8', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion T', 'material', '20', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('76b0eefc-a016-447c-a5f9-25b70218b833', 'a0000000-0000-0000-0000-000000000001', 'Cupla termofusion T', 'material', '25', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('01736b9c-4885-4482-ad2f-982f6ca9f3ee', 'a0000000-0000-0000-0000-000000000001', 'Curitas ', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('28cb3f94-2407-4ed8-a487-5c08af4489c8', 'a0000000-0000-0000-0000-000000000001', 'Curva', 'material', '110x45', 6, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C43', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('95d1ac0e-5c83-4e96-a696-2a26ca3fdceb', 'a0000000-0000-0000-0000-000000000001', 'Curva M-H', 'material', '40X30', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C39', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9d95db4e-f3ed-4562-a442-99487717b55e', 'a0000000-0000-0000-0000-000000000001', 'Curvas', 'material', '20', 6, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C55', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('61852454-1375-42b1-a4ab-5f598879de38', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '63x32', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C16', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1b9738bc-2ee1-4ed8-aaba-0cdab480f9f1', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '125x63', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C17', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4a90d971-ef65-4edd-a99f-c56c5078554f', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '90x63', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C17', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('981430e0-248a-4c8e-a59a-66101bce5240', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '50x25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C17', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('64f1f350-0683-4d85-a1c8-41a8eccf89dc', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '63x25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C17', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('64f1f350-0683-4d85-a1c8-41a8eccf89dc', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '63x25', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C19', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('981430e0-248a-4c8e-a59a-66101bce5240', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '50x25', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C19', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('61852454-1375-42b1-a4ab-5f598879de38', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '63x32', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C19', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('23a05892-addc-4a01-ad1f-5486a02221b2', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '180x32', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C20', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e350584d-df78-441f-af90-e145e0ff73ef', 'a0000000-0000-0000-0000-000000000001', 'Derivador abrazadera electrofusion', 'material', '90x32', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C20', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('322165b9-0121-4535-a6ee-51704d0553f3', 'a0000000-0000-0000-0000-000000000001', 'Desague pluvial ', 'material', '110x20x20', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C44', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3d996f77-a1b4-4b7f-a465-86c768740e25', 'a0000000-0000-0000-0000-000000000001', 'Detector de fallas ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1a5d33d5-b284-465b-adca-d44ca0adbe15', 'a0000000-0000-0000-0000-000000000001', 'Dicroica', 'material', '5w', 52, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C57', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c50c6ba6-3963-46db-a270-8914f7bf7510', 'a0000000-0000-0000-0000-000000000001', 'Distanciometro (Bremen)', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('850ce117-e859-4ad5-a10d-c965d48327ae', 'a0000000-0000-0000-0000-000000000001', 'Distanciometro (leica)', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d5b21f0c-0eb7-4127-ad33-5cb4c4bccf8d', 'a0000000-0000-0000-0000-000000000001', 'Disyuntor', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3d714740-86f9-49c2-a401-ec7a93e626a8', 'a0000000-0000-0000-0000-000000000001', 'Dobladora de Caños ', 'material', 'unidad', 2, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ed092565-784e-486f-a556-697e4772cb18', 'a0000000-0000-0000-0000-000000000001', 'Embellecedor ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', 'Tapa de la Base de asiento ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c3d1ee71-3318-4077-a796-609b11045563', 'a0000000-0000-0000-0000-000000000001', 'Embellecedores', 'material', '-', 6, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e180b5b5-ba06-4e87-a5a3-29821fb9390c', 'a0000000-0000-0000-0000-000000000001', 'Enchufe Acop 7 Cont', 'material', '-', 3, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('97dadba8-b0be-48fb-a37d-260df24eac6b', 'a0000000-0000-0000-0000-000000000001', 'Enchufe H', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6cff6850-cf22-452a-a87e-3e15c56a835e', 'a0000000-0000-0000-0000-000000000001', 'Enchufe industrial H', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9a62dbaa-88e9-42c2-a134-5a2216a6148c', 'a0000000-0000-0000-0000-000000000001', 'Enchufe industrial M', 'material', '-', 13, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C55', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('354b7ca7-ecc8-4f0d-ad4d-beccbddfd48f', 'a0000000-0000-0000-0000-000000000001', 'Enchufe industrial trifasico', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('354b7ca7-ecc8-4f0d-ad4d-beccbddfd48f', 'a0000000-0000-0000-0000-000000000001', 'Enchufe industrial trifasico', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C55', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1926f8ed-5ad2-453b-af4b-d4b0cf04f853', 'a0000000-0000-0000-0000-000000000001', 'Enchufe Trifasico H', 'material', '-', 8, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C56', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1926f8ed-5ad2-453b-af4b-d4b0cf04f853', 'a0000000-0000-0000-0000-000000000001', 'Enchufe Trifasico H', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C56', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('19f1b051-721b-4aa1-a985-9240ea0db92a', 'a0000000-0000-0000-0000-000000000001', 'Enganche de Trailer ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('df38a99f-e9e0-480d-aa59-8b6887647ef3', 'a0000000-0000-0000-0000-000000000001', 'Entonador Universal ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('df38a99f-e9e0-480d-aa59-8b6887647ef3', 'a0000000-0000-0000-0000-000000000001', 'Entonador Universal ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5acb25bd-9ab4-42e1-affe-44217c96fbb3', 'a0000000-0000-0000-0000-000000000001', 'Entrerosca epoxi', 'material', '1 1/4', 8, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('313b2bb6-6ebc-4089-aa12-e84c77fc16b7', 'a0000000-0000-0000-0000-000000000001', 'Entrerosca epoxi', 'material', '46', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('91096ace-5c74-4655-a27c-5bdb9bda066c', 'a0000000-0000-0000-0000-000000000001', 'Entrerosca epoxi', 'material', '90', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e71f21ce-01a4-4b1e-a34b-afb8f94a9217', 'a0000000-0000-0000-0000-000000000001', 'Entrerosca epoxi', 'material', '1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cd1744af-1399-40b3-af45-9197601f8d9f', 'a0000000-0000-0000-0000-000000000001', 'Entrerosca epoxi', 'material', '20', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('06418176-ba66-41e8-aaed-6904a8e7b684', 'a0000000-0000-0000-0000-000000000001', 'Entrerosca epoxi', 'material', '3/4', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('32f84afc-cf6b-45de-ad6b-420f65ad85c7', 'a0000000-0000-0000-0000-000000000001', 'Escuadra soporte repisa', 'material', '-', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('62f5d614-fde1-4308-a1f0-7ebd96e06776', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Epoxi p/caño gas ', 'material', 'unidad', 9, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', '9(entre usados y nuevos)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('62f5d614-fde1-4308-a1f0-7ebd96e06776', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Epoxi p/caño gas ', 'material', 'unidad', 9, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', '9(entre usados y nuevos)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d97a71f4-6e43-459a-a18d-036e79542186', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Epoxi Pintura', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d97a71f4-6e43-459a-a18d-036e79542186', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Epoxi Pintura', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f0308281-ebec-4521-a5cd-eed03f1dd68e', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante AB', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f0308281-ebec-4521-a5cd-eed03f1dd68e', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante AB', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('46b3bc48-ef49-48e0-ad9d-7ba7096b3303', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante Alum', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('46b3bc48-ef49-48e0-ad9d-7ba7096b3303', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante Alum', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('69f5a087-4fdc-41b9-ad0a-38c96ef781ea', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante MB', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('69f5a087-4fdc-41b9-ad0a-38c96ef781ea', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante MB', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('aeb389f4-a1fa-449a-aa51-c55b96d16d82', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante VB', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('aeb389f4-a1fa-449a-aa51-c55b96d16d82', 'a0000000-0000-0000-0000-000000000001', 'Esmalte Sint Brillante VB', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fff5edba-f760-4505-a783-b43e45b676ef', 'a0000000-0000-0000-0000-000000000001', 'Espatula chica', 'material', '-', 5, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C62', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dca70e24-c1af-4f1a-ae3a-4659147fb1bd', 'a0000000-0000-0000-0000-000000000001', 'Espatula Grande', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C62', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fc2ed7fb-693a-4aad-addd-a4250bee488d', 'a0000000-0000-0000-0000-000000000001', 'Espatula mediana', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C62', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('69d0d24d-8192-4ca6-a0a0-49a1c802920f', 'a0000000-0000-0000-0000-000000000001', 'Espiga doble ', 'material', '3/4', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('67bb5d57-739e-40c4-a518-dadcf8dd567a', 'a0000000-0000-0000-0000-000000000001', 'Espiga doble ', 'material', '1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6a478fbe-9eb9-4bd2-a273-c6947d26ca62', 'a0000000-0000-0000-0000-000000000001', 'Estopa', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C33', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5d79dd25-1872-4390-ad24-ca1e434ecfad', 'a0000000-0000-0000-0000-000000000001', 'extractor de tuberia chico', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d1a9b45a-13ce-4460-a29d-6daaa1b6523f', 'a0000000-0000-0000-0000-000000000001', 'extractor de tuberia grande', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cd3338fc-899b-41de-aab9-dc4d10bc07ed', 'a0000000-0000-0000-0000-000000000001', 'Extractor Mecanico ', 'material', 'unidad', 1, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9f406fe0-f162-403d-a9b1-e8d621de874d', 'a0000000-0000-0000-0000-000000000001', 'Farol tortuga Oval', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C45', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2f57d594-0a8e-42b8-afb4-236feb4bef71', 'a0000000-0000-0000-0000-000000000001', 'Faros H4', 'material', '-', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7aa882ba-c332-4039-a1be-9a9f2c3046db', 'a0000000-0000-0000-0000-000000000001', 'Faros led ', 'material', '-', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('22a93481-fcd6-45de-aa24-6f4bd209f578', 'a0000000-0000-0000-0000-000000000001', 'Filmina Fusora ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a93f0cca-ecfe-4cb9-ace4-c9c2d6e19930', 'a0000000-0000-0000-0000-000000000001', 'Filtro Cat ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C75', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4cc31cab-fef4-4604-a5c9-6ac697f49d47', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Aceite Cat', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9feaaa5f-67cb-402b-afbc-aebbc2644a11', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Aceite Cat (usado)', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ab14eb2d-4d38-4f16-abc2-8574a323ee25', 'a0000000-0000-0000-0000-000000000001', 'Filtro de aceite CTP', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5bac84b2-3ce0-4475-adf4-bc6f09dc2136', 'a0000000-0000-0000-0000-000000000001', 'Filtro de aceite Sakura ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C76', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('94dbfa54-6372-416d-af06-c55f80bb977a', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Aire', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cc723e1d-10d5-4677-a730-3c9d91033ede', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Aire ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('80eb50b0-6c91-489a-a8da-bcb833cbb25d', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Aire (usado)', 'material', 'unidad', 7, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a6d0132f-174c-43d1-ab19-8220eed5da01', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Aire LD (Chico) 1106326', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C75', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('019ffe1f-9b58-4c43-a2f6-7e09f3062671', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Aire LD (Grande) 1106331', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C75', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4ffe8600-4e76-4c21-ac25-3c014bdbb9ba', 'a0000000-0000-0000-0000-000000000001', 'Filtro de combustible (usado)', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4ccbc9ad-f728-4058-ae84-8f4d74f79898', 'a0000000-0000-0000-0000-000000000001', 'Filtro de Combustible Borhh', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c78ca4ce-aee6-4d10-a008-c9c654baff75', 'a0000000-0000-0000-0000-000000000001', 'Filtro FAHR', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C75', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ea62b130-cadc-4899-a9dc-198e7e5938a9', 'a0000000-0000-0000-0000-000000000001', 'Flexible cobre', 'material', '-', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('41398156-a6bb-4387-ac37-87bb6b333f61', 'a0000000-0000-0000-0000-000000000001', 'Flexible cromado', 'material', '20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('109de4f0-e94e-4edc-a48d-a88849b1e1c6', 'a0000000-0000-0000-0000-000000000001', 'Flexible Rigido p/ agua/gas', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C33', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0547a114-4b4e-45e6-a62f-5a75cd25ad79', 'a0000000-0000-0000-0000-000000000001', 'Flotante silencioso', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C37', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8cc71792-9398-4f11-aa13-aeee88143621', 'a0000000-0000-0000-0000-000000000001', 'Foco', 'material', '7w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8cc71792-9398-4f11-aa13-aeee88143621', 'a0000000-0000-0000-0000-000000000001', 'Foco', 'material', '7w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ce321416-3e3d-4c51-aab0-0966c62ab5ed', 'a0000000-0000-0000-0000-000000000001', 'Foco led ', 'material', '15w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ce321416-3e3d-4c51-aab0-0966c62ab5ed', 'a0000000-0000-0000-0000-000000000001', 'Foco led ', 'material', '15w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0a397bec-d735-4124-a703-01f6e5f41308', 'a0000000-0000-0000-0000-000000000001', 'Focos', 'material', '11.5', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C50', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('84dcbe82-d25a-49fb-a254-45ced664904d', 'a0000000-0000-0000-0000-000000000001', 'Focos Alo', 'material', '-', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('70ab398b-a7f7-4deb-a614-a443b4424c96', 'a0000000-0000-0000-0000-000000000001', 'Fondo Blanco p/ Maderas ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('70ab398b-a7f7-4deb-a614-a443b4424c96', 'a0000000-0000-0000-0000-000000000001', 'Fondo Blanco p/ Maderas ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('98deb212-a330-4a98-acd5-2978030e7fb1', 'a0000000-0000-0000-0000-000000000001', 'Fotocelula', 'material', '-', 7, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C50', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a3ae3f2e-58ca-4404-a815-82660a01a602', 'a0000000-0000-0000-0000-000000000001', 'Fuelle de Conexión', 'material', '50', 24, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('de38cc2c-05c4-46c4-aaf4-1ea7af0d0f1a', 'a0000000-0000-0000-0000-000000000001', 'Gabinete', 'material', '20x15', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7bb8c2da-a865-4141-a9ef-3bb291b2f3d2', 'a0000000-0000-0000-0000-000000000001', 'Gabinete', 'material', '30x20', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ac3be8ea-90f3-4d87-a280-86430fe6a48b', 'a0000000-0000-0000-0000-000000000001', 'Gancho p/techo', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C54', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1951bdf6-e8d5-4dc2-aa7d-bad7804033b9', 'a0000000-0000-0000-0000-000000000001', 'Gato Hidraulico', 'material', '20T', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C84', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e2f487c7-6c22-4e6e-ab25-b2816399edb3', 'a0000000-0000-0000-0000-000000000001', 'Gato Hidraulico', 'material', 'unidad', 2, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C84', 'Pesaje Borrado')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('21b50c89-c31f-4cf0-ad89-5825155ab27b', 'a0000000-0000-0000-0000-000000000001', 'Gel Antiadherente', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('21b50c89-c31f-4cf0-ad89-5825155ab27b', 'a0000000-0000-0000-0000-000000000001', 'Gel Antiadherente', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a6ffc18d-5146-4f2c-a5c6-8939241f176a', 'a0000000-0000-0000-0000-000000000001', 'Glicerina ', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a6ffc18d-5146-4f2c-a5c6-8939241f176a', 'a0000000-0000-0000-0000-000000000001', 'Glicerina ', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3d658519-e637-498b-a8fd-7750b28e628f', 'a0000000-0000-0000-0000-000000000001', 'Grampa con tarugo', 'material', '1/2', 10, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('097b25b2-7f94-4015-a980-aa5792330eee', 'a0000000-0000-0000-0000-000000000001', 'Grampa p/fijar', 'material', '20', 0, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C55', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7b1d9270-9100-4952-a004-9db281917843', 'a0000000-0000-0000-0000-000000000001', 'Grampa p/lona', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('05abce2a-b7e9-48c8-a2ac-6a411a2a9f2e', 'a0000000-0000-0000-0000-000000000001', 'Grifa', 'material', 'unidad', 1, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d6b349d4-3dff-4daa-aa86-939ab60c60f3', 'a0000000-0000-0000-0000-000000000001', 'Grifa ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4e855c63-5a99-4c53-a15f-84f672fe244e', 'a0000000-0000-0000-0000-000000000001', 'Grifa 12 ', 'herramienta', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('531a25e6-5927-400f-a912-5ef029263d14', 'a0000000-0000-0000-0000-000000000001', 'Grifa 12-10', 'herramienta', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8ddcfab9-1ec8-4923-a0dc-480c56adf0ab', 'a0000000-0000-0000-0000-000000000001', 'Grifo cromado', 'material', '-', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8ddcfab9-1ec8-4923-a0dc-480c56adf0ab', 'a0000000-0000-0000-0000-000000000001', 'Grifo cromado', 'material', '-', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9dbfd740-ca16-4658-a0c8-d784897eb92d', 'a0000000-0000-0000-0000-000000000001', 'Grifos ', 'material', 'unidad', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C47', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d77573e2-c686-451d-ac7e-8596fb40825c', 'a0000000-0000-0000-0000-000000000001', 'Grifos ', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C47', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('332f90f5-a093-40b0-a4c4-d1f0ac63b163', 'a0000000-0000-0000-0000-000000000001', 'Grillete Acero ', 'material', '-', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8b9b2af3-80ce-48c3-a406-69d51c8beab4', 'a0000000-0000-0000-0000-000000000001', 'Grillete D', 'material', 'unidad', 4, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0f03c66f-34ad-47f0-a775-45de2ddba965', 'a0000000-0000-0000-0000-000000000001', 'Grippen', 'material', '3/4', 40, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C30', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('122699f5-c321-449a-a418-a36a54e96de6', 'a0000000-0000-0000-0000-000000000001', 'Guantes Moteados ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('122699f5-c321-449a-a418-a36a54e96de6', 'a0000000-0000-0000-0000-000000000001', 'Guantes Moteados ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('56a2b1bd-8117-428f-a25d-6158c04456ca', 'a0000000-0000-0000-0000-000000000001', 'Guantes Negros ', 'material', 'unidad', 2, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N1-C73', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('56a2b1bd-8117-428f-a25d-6158c04456ca', 'a0000000-0000-0000-0000-000000000001', 'Guantes Negros ', 'material', 'unidad', 2, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N1-C73', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('86274766-967b-435a-a8bb-b24bc627de2d', 'a0000000-0000-0000-0000-000000000001', 'Guia metalica p/plafon ', 'material', '-', 9, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6bdfaf28-e06c-41b7-a86c-5d94b34755ab', 'a0000000-0000-0000-0000-000000000001', 'Handy', 'material', '-', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c900a44b-5cd0-4e1e-a817-866b80f73798', 'a0000000-0000-0000-0000-000000000001', 'Herramientas (', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('85e0b470-548e-45ea-ac3c-54bb27d029e8', 'a0000000-0000-0000-0000-000000000001', 'Hidrante de Agua', 'material', '75', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C31', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a6b8acf1-a2e4-4135-a57e-4b0fdfc35f4f', 'a0000000-0000-0000-0000-000000000001', 'Hidro ATF lubri', 'material', 'unidad', 0, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ef06b99f-dff8-4e9f-a5cf-1e3ca38e3d90', 'a0000000-0000-0000-0000-000000000001', 'Hidrolavadora a Presion ', 'material', '1200w', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C84', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0a25d63d-c5b5-41fc-aa8b-a193a04f48f4', 'a0000000-0000-0000-0000-000000000001', 'Imprimador', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0a25d63d-c5b5-41fc-aa8b-a193a04f48f4', 'a0000000-0000-0000-0000-000000000001', 'Imprimador', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N2-C80', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8fa55440-809a-495d-aae3-04f5a6e15f00', 'a0000000-0000-0000-0000-000000000001', 'Interruptor de Mindirite', 'material', '-', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N2-C72', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('874f9393-8307-43d1-a790-30cb8bff51fd', 'a0000000-0000-0000-0000-000000000001', 'Inyecto POE c/ alarge ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bccfe0d0-10a9-44ef-a4d3-f5539bd0bfc8', 'a0000000-0000-0000-0000-000000000001', 'Junta', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bccfe0d0-10a9-44ef-a4d3-f5539bd0bfc8', 'a0000000-0000-0000-0000-000000000001', 'Junta', 'material', 'unidad', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('da298f57-3c8f-4df8-a2e1-5150bc581fc7', 'a0000000-0000-0000-0000-000000000001', 'Junta Tapacilindro Lonking ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('edb7a2e7-ec11-430a-ae00-186be7ecefaa', 'a0000000-0000-0000-0000-000000000001', 'Kit de Salida De Calefactor', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('47433262-b3dc-4147-a303-30192b0da99b', 'a0000000-0000-0000-0000-000000000001', 'Kit Led r8', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('263f5ed8-442b-45f5-a4ed-db174e6af6e5', 'a0000000-0000-0000-0000-000000000001', 'Lamina TC', 'material', '900/60', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C63', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e3a9e657-38f1-421b-a1f8-1829484f9f3b', 'a0000000-0000-0000-0000-000000000001', 'Lampara (vidrio)', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e4bf7ffc-558a-44dc-af63-17646247b6e3', 'a0000000-0000-0000-0000-000000000001', 'Lampara Alo ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0629bd26-246e-4e4c-ab38-56197ac7f007', 'a0000000-0000-0000-0000-000000000001', 'Lampara c/ porta ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6642edb7-7445-4d89-a179-feb603f249d4', 'a0000000-0000-0000-0000-000000000001', 'Lampara Fluo', 'material', '105w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C57', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fd9f4ccd-2e2b-419a-a8fe-f09d7e5306f9', 'a0000000-0000-0000-0000-000000000001', 'Latex Impermeable Turquesa ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fd9f4ccd-2e2b-419a-a8fe-f09d7e5306f9', 'a0000000-0000-0000-0000-000000000001', 'Latex Impermeable Turquesa ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d0252679-e06f-4527-af65-2b07a8c2542f', 'a0000000-0000-0000-0000-000000000001', 'Lentes Negros', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d0252679-e06f-4527-af65-2b07a8c2542f', 'a0000000-0000-0000-0000-000000000001', 'Lentes Negros', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f39d4b6f-9ad0-4f36-afae-5e7501be0249', 'a0000000-0000-0000-0000-000000000001', 'Letras p/pintar ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('60ea3eb9-e15d-44a5-acd4-158391ae56a5', 'a0000000-0000-0000-0000-000000000001', 'Lija', 'material', '320', 5, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4f5421e0-2075-40b6-af51-f49314e8d8e7', 'a0000000-0000-0000-0000-000000000001', 'Lija', 'material', '600', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7d66c188-07d4-4aa7-adc2-0433a00a500d', 'a0000000-0000-0000-0000-000000000001', 'Lija', 'material', '120', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ff1f797c-169a-479e-a0da-3cd02632db34', 'a0000000-0000-0000-0000-000000000001', 'Lija', 'material', '80', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6ca5f686-7cbc-4f87-a491-fa030a44f6f9', 'a0000000-0000-0000-0000-000000000001', 'Lija', 'material', '60', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('aaa2d5cf-0911-4f3e-a449-5b6cf569d902', 'a0000000-0000-0000-0000-000000000001', 'Lija', 'material', '240', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e5f22669-1d62-46c9-a1ab-2283bee092ed', 'a0000000-0000-0000-0000-000000000001', 'Limpia Inyec. Diesel', 'material', 'unidad', 0, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fc22ff82-519f-41ae-acfc-eacdfec38015', 'a0000000-0000-0000-0000-000000000001', 'Linterna', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fd30eda6-adf4-4c60-a06d-312f9b7af7bc', 'a0000000-0000-0000-0000-000000000001', 'Liquido Limpia Parabrisas ', 'material', 'unidad', 0, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('daa5895f-ea93-4226-acb9-d33d280bf731', 'a0000000-0000-0000-0000-000000000001', 'Liquido p/ frenos ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e360d2eb-d2d3-430b-ab78-83f87c86e223', 'a0000000-0000-0000-0000-000000000001', 'Litangirio', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('479a82f0-26d7-47e3-ad10-6fe8b62ef3f4', 'a0000000-0000-0000-0000-000000000001', 'Litargirio', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0c992f6a-7511-4a7e-aa9a-f75083d298ad', 'a0000000-0000-0000-0000-000000000001', 'llana', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C62', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('77d97623-91e9-459a-a42b-1c8b4d68d285', 'a0000000-0000-0000-0000-000000000001', 'Llava paso termofusion ', 'material', '25', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('578c0bd1-e84f-4cf5-adc9-b5466784a5e6', 'a0000000-0000-0000-0000-000000000001', 'Llava paso termofusion ', 'material', '20', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('052dc216-237e-4008-a285-f59fd6fb2a51', 'a0000000-0000-0000-0000-000000000001', 'Llavae de paso termofusion', 'material', '20', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('79daed23-ab35-45b5-a344-eaa6c4fc3bd0', 'a0000000-0000-0000-0000-000000000001', 'Llave Bujia ', 'herramienta', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('48acd20b-893b-495a-aa12-454a5e06c1b7', 'a0000000-0000-0000-0000-000000000001', 'Llave cruz', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('030a5b06-b6ef-4517-a2bd-d2dc153dfd7b', 'a0000000-0000-0000-0000-000000000001', 'Llave de paso', 'material', '25', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fa1f49c8-49ec-45e4-a204-0cf9d096fa31', 'a0000000-0000-0000-0000-000000000001', 'Llave de paso', 'material', '28', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5bb36236-7585-4ee3-abab-1330a781b623', 'a0000000-0000-0000-0000-000000000001', 'Llave de paso ', 'material', '40', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d5bcb8cf-ff88-4dcc-ae75-410b59fbd5ae', 'a0000000-0000-0000-0000-000000000001', 'Llave de paso ', 'material', '1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C37', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b71bc27a-88fd-4021-a326-e82b3738877f', 'a0000000-0000-0000-0000-000000000001', 'Llave Ferula ', 'material', '25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C29', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7b6bdb4e-0571-4c30-a625-7ec23df7b93b', 'a0000000-0000-0000-0000-000000000001', 'Llave paso termofusion ', 'material', '25', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ace10bbb-d9a6-4956-ac1f-7820b5b33996', 'a0000000-0000-0000-0000-000000000001', 'Llave paso termofusion ', 'material', '20', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('35955450-23bc-4500-ab07-6cf8cc58d3e8', 'a0000000-0000-0000-0000-000000000001', 'Llave tubo p/ruedas', 'herramienta', 'unidad', 3, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0cc9d83b-a4a7-4ca0-a889-b77a6900a482', 'a0000000-0000-0000-0000-000000000001', 'Lonas ', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C52', 'Arriba ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a8a318b9-bee9-464e-a29b-70eacb45859d', 'a0000000-0000-0000-0000-000000000001', 'Lubri p/ Trans Auto ', 'material', 'unidad', 0, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('70703c75-bf84-463b-ad1e-fc0b4ae20447', 'a0000000-0000-0000-0000-000000000001', 'Lubricante p/ motores ', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('22171982-795d-4962-af14-73d597da4044', 'a0000000-0000-0000-0000-000000000001', 'Luz de emergencia ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7239fd20-a5a5-4031-a121-e4f3f325ebb6', 'a0000000-0000-0000-0000-000000000001', 'Malla de fibra de vidrio', 'material', '-', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C63', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('36de22c0-4138-4ed3-a7ea-f8efea84cc7e', 'a0000000-0000-0000-0000-000000000001', 'Mameluco  Descar', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('36de22c0-4138-4ed3-a7ea-f8efea84cc7e', 'a0000000-0000-0000-0000-000000000001', 'Mameluco  Descar', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('55658602-7850-4a3e-ac71-e95138a72ebc', 'a0000000-0000-0000-0000-000000000001', 'Mandril de garras ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C63', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('12c806f2-7eb7-45b7-a6eb-9bd53484f17b', 'a0000000-0000-0000-0000-000000000001', 'Mango taladro', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('99bca05f-1741-46a9-a3ea-b0a75b78f836', 'a0000000-0000-0000-0000-000000000001', 'Manguera c/ Interruptor ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('50d4f33a-a16f-46ec-aa66-6745ec787ec0', 'a0000000-0000-0000-0000-000000000001', 'Manguera Nivel ', 'material', 'unidad', 12, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('057dbf1b-8248-4822-ab50-4d0f0bd6a399', 'a0000000-0000-0000-0000-000000000001', 'Manguera Vibro', 'material', 'unidad', 1, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N2-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('172bdc56-7311-4342-a1fb-8edd2667dcd6', 'a0000000-0000-0000-0000-000000000001', 'Manija llave de paso', 'material', '-', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3ca23795-8cae-44a6-a232-1b96622aa438', 'a0000000-0000-0000-0000-000000000001', 'Manija valvula esferica gnl', 'material', '-', 6, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C29', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('32dd824d-702f-4222-a7a5-fd107d7e4e94', 'a0000000-0000-0000-0000-000000000001', 'Manillar y embellecedor', 'material', '-', 14, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2aa5fdc2-f10b-454c-a52e-cc79a97338be', 'a0000000-0000-0000-0000-000000000001', 'Manometro', 'material', '7', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('17d0a3b1-ee1e-494a-ab65-0ccba6dc2905', 'a0000000-0000-0000-0000-000000000001', 'Manometro', 'material', '100', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d66913fa-9771-427d-a8eb-7208ab872f4a', 'a0000000-0000-0000-0000-000000000001', 'Manometro', 'material', '60', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3804470a-7790-4661-ac78-b07c103343aa', 'a0000000-0000-0000-0000-000000000001', 'Manometro', 'material', '10', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('db7d3335-e7f6-49d4-a493-59a6539e6426', 'a0000000-0000-0000-0000-000000000001', 'Manometro', 'material', '6', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cebb6e05-afb3-4f9d-a4b7-28e20aa33275', 'a0000000-0000-0000-0000-000000000001', 'Manometro p/ ruedas ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fa4615fc-881e-43b2-a4e7-173c76ced457', 'a0000000-0000-0000-0000-000000000001', 'Manometro p/ ruedas ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('153f4caf-15b3-446c-ac5d-982e9228ed52', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '0.5', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('39f7a5f8-633b-4d04-aebc-ec6e0e302500', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '60', 3, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cdd30189-037a-4e20-a4af-26e90474f620', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '7k', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d62e44b6-546c-4e4f-a865-2e1c368b7032', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '100', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7d5e55f6-ed62-43e6-ae25-b67203bf88da', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '60', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e1c3a6f3-b905-4b46-a3df-d3e755036395', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '5', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d3e92a51-8648-43e1-a5c0-b03a2a56221a', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '10k', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('32f087d9-a1bf-42f6-af60-67e0d9e88f06', 'a0000000-0000-0000-0000-000000000001', 'Manometros ', 'material', '6', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b5dece6e-1456-4bc9-a16d-dce3099233b0', 'a0000000-0000-0000-0000-000000000001', 'Manometros agua ', 'material', '60k', 3, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fcbbc0b7-f1c4-445c-a5fb-c7eb66bf2b2c', 'a0000000-0000-0000-0000-000000000001', 'Manta Termocontraible P/tuberia ', 'material', 'unidad', 16, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fcbbc0b7-f1c4-445c-a5fb-c7eb66bf2b2c', 'a0000000-0000-0000-0000-000000000001', 'Manta Termocontraible P/tuberia ', 'material', 'unidad', 16, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('59b2cef5-b494-4862-a1fb-3428d1fe1e4e', 'a0000000-0000-0000-0000-000000000001', 'Manual Sierra Circular ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C76', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('59b2cef5-b494-4862-a1fb-3428d1fe1e4e', 'a0000000-0000-0000-0000-000000000001', 'Manual Sierra Circular ', 'material', 'unidad', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C76', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('489cef62-6bf2-4c2d-ab4e-4c3121fbbad9', 'a0000000-0000-0000-0000-000000000001', 'Martillo Demoledor Grande Total ', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('becb0232-c2e7-49df-ace4-a5cd87658319', 'a0000000-0000-0000-0000-000000000001', 'Mascara de Soldar ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('190c834a-9db6-4282-ad2a-3fde2c31c150', 'a0000000-0000-0000-0000-000000000001', 'Mascara Protectora ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d3413bd5-9297-47c0-a5f3-1ef5c9b274ab', 'a0000000-0000-0000-0000-000000000001', 'Masilla Epoxi', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2236b950-209d-4dcd-a835-a20f6220aa3a', 'a0000000-0000-0000-0000-000000000001', 'Masilla Tradicional ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2236b950-209d-4dcd-a835-a20f6220aa3a', 'a0000000-0000-0000-0000-000000000001', 'Masilla Tradicional ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d4bd36f9-36f3-4225-acb9-f25a5402d874', 'a0000000-0000-0000-0000-000000000001', 'Matrices de acero y bronce', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C66', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d585b472-e8f3-461a-a512-6052e05f1536', 'a0000000-0000-0000-0000-000000000001', 'Mecha copa madera', 'material', '8mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fcc7106c-25fa-43b3-aa39-4da2dd7521e0', 'a0000000-0000-0000-0000-000000000001', 'Medidor de fugas Pont ', 'material', '-', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N2-C71', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c00af926-f934-4755-abfa-96750aabda0d', 'a0000000-0000-0000-0000-000000000001', 'Modulo 1 punto-1 ciega- 1 toma ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5b33b9e8-9867-430b-a1be-763d6ab9ca81', 'a0000000-0000-0000-0000-000000000001', 'Modulo 2 puntos ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('875b55cb-19e9-41e7-a517-83ea6fc0c919', 'a0000000-0000-0000-0000-000000000001', 'Modulo Blanco', 'material', '-', 25, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5f5d09b6-90b8-451d-a7c9-cb037b860983', 'a0000000-0000-0000-0000-000000000001', 'Moladora Bosch ', 'herramienta', ' 770w', 1, NULL, NULL, 'Estan. Herramientas (operativa)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1c305f7f-05b2-46b7-acf1-90482436fb19', 'a0000000-0000-0000-0000-000000000001', 'Moladora Makita ', 'herramienta', '2000w', 1, NULL, NULL, 'Estan. Herramientas (operativa)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0f5a08c6-701b-4083-a767-742f58aa0bab', 'a0000000-0000-0000-0000-000000000001', 'Moladora Metabo ', 'herramienta', 'unidad', 1, NULL, NULL, 'Estan. Herramientas (operativa)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a85d3077-f1b4-4f9c-a12f-5a724856fe63', 'a0000000-0000-0000-0000-000000000001', 'Molde partido fundicion', 'material', '-', 70, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C64', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b4c0385f-f8db-4c56-a222-1dcbb57953c4', 'a0000000-0000-0000-0000-000000000001', 'Mordaza estrella ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cc7ae57f-d174-4442-ab13-91e8d564ec0a', 'a0000000-0000-0000-0000-000000000001', 'Mordaza p/ Maquina Electrofusion ', 'material', 'unidad', 2, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N3-C84', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('253c3972-3f18-4edd-a626-98c9e5bafc31', 'a0000000-0000-0000-0000-000000000001', 'Morsetos ', 'material', '-', 11, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4939d43e-f10f-4528-a914-2dd9b84b37bb', 'a0000000-0000-0000-0000-000000000001', 'Morza  ', 'material', 'unidad', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C84', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a8a27dd1-aba1-4f7c-a509-5ebd547defa9', 'a0000000-0000-0000-0000-000000000001', 'Morza p/ Caño ', 'material', 'unidad', 2, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C84', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1a0d6a4f-fa1e-4345-a2af-03be8167bd03', 'a0000000-0000-0000-0000-000000000001', 'Morzada de Empùje ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('eee1376d-ffa8-4938-a56d-9bfdfac66779', 'a0000000-0000-0000-0000-000000000001', 'Muestras madera', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C47', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1a522d4e-3ba3-4764-a45a-c53a7569fda3', 'a0000000-0000-0000-0000-000000000001', 'Muestras Madera ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9e5e73fc-9705-4ea4-a3fc-4ac3c88a5b67', 'a0000000-0000-0000-0000-000000000001', 'Multimetro', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('00cf4b13-3ae0-4744-a9b5-c685bf6ec9cc', 'a0000000-0000-0000-0000-000000000001', 'Niple ', 'material', '3/4', 10, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ae074992-0054-4233-a266-0be79520837c', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2e1860e8-d00c-4beb-a6fe-13e941fd17e8', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '1.4', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0d482e4d-f34d-47c5-a910-238e2df05836', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '1', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ae074992-0054-4233-a266-0be79520837c', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ae074992-0054-4233-a266-0be79520837c', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '20', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C27', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c47ec030-e23d-448c-af4c-e58362ece09d', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '15', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C27', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4ce34004-3a28-4eed-aafe-ef17c873d70e', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C27', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0ecdad42-3fd5-441e-a1ed-ae195752badf', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '18', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C27', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a2dbc94d-eff4-45cc-a886-81d6f542b16c', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '35', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C27', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5b2f4c2d-c05c-47e7-aa3d-cf716118db0b', 'a0000000-0000-0000-0000-000000000001', 'Niple conexión epoxi', 'material', '2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C27', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('45453fb3-d62d-419e-ac31-0f0677ba1eae', 'a0000000-0000-0000-0000-000000000001', 'Niple rosca', 'material', '3/4', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('759fd21d-f9da-487a-a289-3d429aa6ac8d', 'a0000000-0000-0000-0000-000000000001', 'Niple rosca', 'material', '1/2', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b9d3b921-840b-4118-a7c1-d3ad2cf1939e', 'a0000000-0000-0000-0000-000000000001', 'Nivel Optico Auto-B4', 'material', 'unidad', 2, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N1-C1', 'Arriba')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cf80fd1b-f993-4922-a695-3460a7530abd', 'a0000000-0000-0000-0000-000000000001', 'Nivel Optico Auto-B4', 'material', 'unidad', 2, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N1-C74', 'Arriba')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3840f1a5-dc24-472a-acb0-239730bba4af', 'a0000000-0000-0000-0000-000000000001', 'Onywall Paper Tape ', 'material', '50mm-150m', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ac0edd82-44bb-4e32-a241-92bb90828d0a', 'a0000000-0000-0000-0000-000000000001', 'Opticas ', 'material', 'unidad', 2, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ac0edd82-44bb-4e32-a241-92bb90828d0a', 'a0000000-0000-0000-0000-000000000001', 'Opticas ', 'material', 'unidad', 2, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2677a5af-e8fa-4f06-a69e-3bf135c60fa1', 'a0000000-0000-0000-0000-000000000001', 'Orings ', 'material', '-', 3, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1f5246a7-acfa-4381-acbd-0eeed6bfce9f', 'a0000000-0000-0000-0000-000000000001', 'Paradpr de Seguridad ', 'material', 'unidad', 2, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1f5246a7-acfa-4381-acbd-0eeed6bfce9f', 'a0000000-0000-0000-0000-000000000001', 'Paradpr de Seguridad ', 'material', 'unidad', 2, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('caa5e494-733d-4da5-acc9-a744a2a5c989', 'a0000000-0000-0000-0000-000000000001', 'Parlantes Auto', 'material', '-', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C53', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0d73f6f6-5fd5-47c1-ac60-8697e1ec0b6e', 'a0000000-0000-0000-0000-000000000001', 'Parte trasera lampara ', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c713ffcc-b509-4f23-a779-873bca84cf21', 'a0000000-0000-0000-0000-000000000001', 'Partes Camion Camioneta ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('964d2c4e-48af-4680-ac48-43afe67e9746', 'a0000000-0000-0000-0000-000000000001', 'Pasador P/candado', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e1b25912-c0ad-4896-a333-b33c70ccb682', 'a0000000-0000-0000-0000-000000000001', 'Pasador palanca', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d9220f4b-c406-4fc3-a0cd-08be8118ea60', 'a0000000-0000-0000-0000-000000000001', 'Pasador traba resorte', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d9220f4b-c406-4fc3-a0cd-08be8118ea60', 'a0000000-0000-0000-0000-000000000001', 'Pasador traba resorte', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9acebaab-7f86-4f37-a201-adedcb6689f6', 'a0000000-0000-0000-0000-000000000001', 'Pasta de pulir', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9acebaab-7f86-4f37-a201-adedcb6689f6', 'a0000000-0000-0000-0000-000000000001', 'Pasta de pulir', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5ee01338-7fbf-4390-a9c9-a68212f5326b', 'a0000000-0000-0000-0000-000000000001', 'Pasta Lubricante', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5ee01338-7fbf-4390-a9c9-a68212f5326b', 'a0000000-0000-0000-0000-000000000001', 'Pasta Lubricante', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9166d2f4-6b18-4ea0-a1ea-773ded363646', 'a0000000-0000-0000-0000-000000000001', 'Patas de goma ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2722ce2b-aa6a-4e4e-a1a2-7c32e82e5b6e', 'a0000000-0000-0000-0000-000000000001', 'Patas de goma ', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('482da3af-9f99-4626-a525-c42b9053ffac', 'a0000000-0000-0000-0000-000000000001', 'Patin superior', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3e611a7c-213a-4eb0-ac03-f68bc885b2a9', 'a0000000-0000-0000-0000-000000000001', 'Petroras Sintium ', 'material', '5000w', 0, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d7576777-982b-4f11-a70e-de1b40184cf2', 'a0000000-0000-0000-0000-000000000001', 'Piezas Cat ', 'material', 'unidad', 0, 'c0113f36-4d30-4b1c-abb3-138e67627339', 'N--C79', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d7576777-982b-4f11-a70e-de1b40184cf2', 'a0000000-0000-0000-0000-000000000001', 'Piezas Cat ', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('19c7c326-6c3f-4abb-a14b-1a2192e7f81d', 'a0000000-0000-0000-0000-000000000001', 'Pincel 1 ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('19c7c326-6c3f-4abb-a14b-1a2192e7f81d', 'a0000000-0000-0000-0000-000000000001', 'Pincel 1 ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('63b5d5f7-1792-46bc-aa60-0e8856558f24', 'a0000000-0000-0000-0000-000000000001', 'Pincel 2 1/2', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('63b5d5f7-1792-46bc-aa60-0e8856558f24', 'a0000000-0000-0000-0000-000000000001', 'Pincel 2 1/2', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('25537f31-ded4-4d7d-a8b5-947d472c9cca', 'a0000000-0000-0000-0000-000000000001', 'Pinzas de Anclaje ', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1273a4a0-5552-4d07-ab54-b41d0d4e4092', 'a0000000-0000-0000-0000-000000000001', 'Piradera Anti Deslizante', 'material', 'unidad', 7, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1273a4a0-5552-4d07-ab54-b41d0d4e4092', 'a0000000-0000-0000-0000-000000000001', 'Piradera Anti Deslizante', 'material', 'unidad', 7, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('767cfd82-b4b6-4bc1-af65-82f42a15f1be', 'a0000000-0000-0000-0000-000000000001', 'Pistola Compresor ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('eea33751-4e0f-4250-add1-8f1a458aa001', 'a0000000-0000-0000-0000-000000000001', 'Pistola Compresor ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('445724ed-c4db-4694-a87e-326677050189', 'a0000000-0000-0000-0000-000000000001', 'Placa de calibracion', 'material', '-', 5, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('690fcb4a-ef8c-4fad-a721-907ebc2c17b7', 'a0000000-0000-0000-0000-000000000001', 'Plafon', 'material', '18', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C50', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d158f00f-ee4b-4e45-ac0a-b5c545bf4200', 'a0000000-0000-0000-0000-000000000001', 'Plafon', 'material', '24', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C51', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('11079492-6384-4f4b-aff3-65be1782e708', 'a0000000-0000-0000-0000-000000000001', 'Plafon led', 'material', '18w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C57', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b902c43f-2636-4a4d-ad96-d6f901e9485f', 'a0000000-0000-0000-0000-000000000001', 'Plafon led', 'material', '6w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C57', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('48cb9e2b-1e88-4090-aff5-5a9b16da8bc2', 'a0000000-0000-0000-0000-000000000001', 'Plafon led ', 'material', '-', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C57', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a34ef581-28bd-45a9-af9c-0292f73d41d7', 'a0000000-0000-0000-0000-000000000001', 'Plafon led ', 'material', '6w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ae9f9bbe-1f77-4912-ac38-5601219fb978', 'a0000000-0000-0000-0000-000000000001', 'Planilla de Curvado', 'material', '300mm', 2, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('800fb91c-c318-40fd-a1ba-261a58351296', 'a0000000-0000-0000-0000-000000000001', 'Plastico Retrovisor ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C76', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e9f7550d-1430-4c4b-a7d8-7ea5e75c23db', 'a0000000-0000-0000-0000-000000000001', 'Plastico Retrovisor ', 'material', 'unidad', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C76', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a088efac-1bfb-45b9-af24-8b298e3f7af4', 'a0000000-0000-0000-0000-000000000001', 'Plato de alumunio ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C62', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('36f5b522-e50c-4fb7-a1dd-e53644fe00ca', 'a0000000-0000-0000-0000-000000000001', 'Porta foco c/ alargue ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a591992a-18b0-47cb-abfe-844a8c906b3a', 'a0000000-0000-0000-0000-000000000001', 'Porta foco c/ Cable ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2e25fe03-5f3f-44ab-a2d1-187193011efa', 'a0000000-0000-0000-0000-000000000001', 'Portafoco', 'material', '-', 7, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C56', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3741f8b9-668a-4a48-a1a0-7563c2213138', 'a0000000-0000-0000-0000-000000000001', 'Portafoco ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C56', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b4a1cbdf-eb89-4a60-af80-58b79798fa2a', 'a0000000-0000-0000-0000-000000000001', 'Portarejilla', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6944d8e6-b8f9-4bb0-a411-a0b15395bec8', 'a0000000-0000-0000-0000-000000000001', 'Poxipol', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C47', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2527b82d-5a41-4df4-aabd-677e0b015057', 'a0000000-0000-0000-0000-000000000001', 'Prensa de mano', 'material', 'unidad', 2, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N2-C1', 'Pasillo 1 Izq ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c2daa09d-3b12-49f6-a0de-eeba78092f3a', 'a0000000-0000-0000-0000-000000000001', 'Prensa de sujecion ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e4d1adba-eda8-4e06-a470-31866d47c733', 'a0000000-0000-0000-0000-000000000001', 'Prensa Soporte p/ Term sell', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4230799c-e326-4982-ac5f-438afcc121ec', 'a0000000-0000-0000-0000-000000000001', 'Proyector', 'material', '200', 7, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C51', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1ec53f73-f3b5-437e-ae11-e363cb1f8685', 'a0000000-0000-0000-0000-000000000001', 'Proyector led ', 'material', '30w', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C57', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8335bfb4-a823-4c4a-a746-f7b66c05b4b8', 'a0000000-0000-0000-0000-000000000001', 'Proyector led con alarge ', 'material', '30w ', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9add6a8b-2c3d-46e2-ab5e-79756e2eb2d1', 'a0000000-0000-0000-0000-000000000001', 'Pruebafoco', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C56', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8b903ed6-343a-4a9e-af7d-c7b767c74dec', 'a0000000-0000-0000-0000-000000000001', 'Puente Epoxi P/union y anclaje ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8b903ed6-343a-4a9e-af7d-c7b767c74dec', 'a0000000-0000-0000-0000-000000000001', 'Puente Epoxi P/union y anclaje ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6114c295-b305-4628-aad2-0cd8eec6f344', 'a0000000-0000-0000-0000-000000000001', 'Pulidora Makita ', 'herramienta', '2200w', 1, NULL, NULL, 'Estan. Herramientas (operativa)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3fc10169-a531-4990-ab5d-4dfe5e8d9767', 'a0000000-0000-0000-0000-000000000001', 'Pulsador Inodoro', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7006174e-3f4e-497e-abad-3f5258431240', 'a0000000-0000-0000-0000-000000000001', 'Punta Dewalt', 'herramienta', 'unidad', 1, NULL, NULL, 'Caja Puntas')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('05328de2-9995-4835-ab7e-31f4972a8bb2', 'a0000000-0000-0000-0000-000000000001', 'Puntas (SDS)', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('af9b5fc5-9ba7-438f-a6c3-aeece77289b6', 'a0000000-0000-0000-0000-000000000001', 'Puntas Makita ', 'material', 'unidad', 9, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0469b74d-999e-48cf-aaa6-1eac3e9f100f', 'a0000000-0000-0000-0000-000000000001', 'Puntas Martillo demoledor', 'material', 'unidad', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ef45e5af-761c-42ed-a3fd-867b337c5756', 'a0000000-0000-0000-0000-000000000001', 'Punteras decorativas ', 'material', '-', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3e68f0d2-7127-4373-a072-6636d69b7b6b', 'a0000000-0000-0000-0000-000000000001', 'Punto interruptor', 'material', '-', 32, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C56', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3b411187-b27a-41e3-a683-45eb5ff395de', 'a0000000-0000-0000-0000-000000000001', 'Quanta 7000 (Diesel)', 'material', 'unidad', 0, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('05355a21-071c-49b9-a530-8befbd192e5a', 'a0000000-0000-0000-0000-000000000001', 'Quanta 7000 (Nafta) ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5dc73422-3b19-4da4-a934-836fc4d6089c', 'a0000000-0000-0000-0000-000000000001', 'Ramal', 'material', '110x63', 2, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C42', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9a6489e7-9e04-47a3-ad66-f0bc72ebb6be', 'a0000000-0000-0000-0000-000000000001', 'Ramal ', 'material', '110', 3, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C42', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a07be201-ecd0-427d-a3bd-2e616de9280c', 'a0000000-0000-0000-0000-000000000001', 'Ramal 45', 'material', '63', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C39', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('74dcbab6-9006-48b2-a778-aeb9e5662fa6', 'a0000000-0000-0000-0000-000000000001', 'Ramal abrazadera electrofusion', 'material', '63', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C5', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2120b4d3-fd7a-4006-a4ef-9c1068e1ceee', 'a0000000-0000-0000-0000-000000000001', 'Ramal de Serv 63', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C14', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2120b4d3-fd7a-4006-a4ef-9c1068e1ceee', 'a0000000-0000-0000-0000-000000000001', 'Ramal de Serv 63', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C14', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('40f393cb-65b0-4868-ae70-82ffc9980f17', 'a0000000-0000-0000-0000-000000000001', 'Ramal simple', 'material', '40', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6c0ae49e-9dff-48cc-ad03-1ea62ac5688d', 'a0000000-0000-0000-0000-000000000001', 'Ramal Y', 'material', '160', 4, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C41', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2a7dbf58-dee5-45c1-a639-d3b32a6d4e24', 'a0000000-0000-0000-0000-000000000001', 'Recorte Cables', 'material', '-', 0, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C45', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e053f853-69f6-46fa-a697-7ee3976be972', 'a0000000-0000-0000-0000-000000000001', 'Reduccion', 'material', '3x2 1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('638d71e0-71e0-4137-a725-c1779469e0d9', 'a0000000-0000-0000-0000-000000000001', 'Reduccion ', 'material', '40x20', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('57ec7122-f3b9-4dfc-a085-ec21b90398b1', 'a0000000-0000-0000-0000-000000000001', 'Reduccion ', 'material', '22x20', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8b5853e6-3579-4751-acf6-0223e86c9cdf', 'a0000000-0000-0000-0000-000000000001', 'Reduccion ', 'material', '32x20', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('932500b5-dabe-4249-a68d-1c3c2008d636', 'a0000000-0000-0000-0000-000000000001', 'Reduccion ', 'material', '32x25', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('85b1cf43-d67d-4daa-a08b-fc50a8b760df', 'a0000000-0000-0000-0000-000000000001', 'Reduccion  ', 'material', '3x2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1c94dd2e-1e5a-420e-a864-71d629bf65e9', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '32x25', 8, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5f91daf4-1c53-4b2d-a4bd-780dc76d034b', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '63x50', 0, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ac4a7c65-c8ca-4975-a13a-c05301661ec8', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '90x63', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('816a73a7-7220-44d7-aeaf-d90a484b0f03', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '110x63', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2180a856-9c47-4646-a839-ba577acad23e', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '160x110', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9706f356-fce9-47cc-a956-fe6eb758a8c3', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '110x75', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C18', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ea4dcf27-7da8-4696-a615-7a23020c5316', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '75x63', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C20', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d32a0b79-3b2d-42d5-a2e7-4a071d79b3cc', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '90x75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ac4a7c65-c8ca-4975-a13a-c05301661ec8', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '90x63', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('816a73a7-7220-44d7-aeaf-d90a484b0f03', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '110x63', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2180a856-9c47-4646-a839-ba577acad23e', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '160x110', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2180a856-9c47-4646-a839-ba577acad23e', 'a0000000-0000-0000-0000-000000000001', 'Reduccion electrofusion', 'material', '160x110', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('423a112b-18e3-4d6e-a014-e5724e83725f', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '50x25', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b9a7d58f-925b-47d7-afa4-cbef6032b030', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '1 1/2 a 1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a279f1b9-df70-45a1-a54c-f3cc11d8bf4b', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '37x18', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1799a41d-e0cb-4cd8-a60a-07f4425381b8', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '35x23', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b7585438-7512-4834-a8e0-5a612649c35c', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '38x36', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b85a13b8-9340-41d0-a5fe-c94780f043d7', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '1/2 x 3/4', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('210757c0-247e-415c-a766-20a2606c9310', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '2 x 1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('301444a1-efea-4acf-adbd-6387f545c055', 'a0000000-0000-0000-0000-000000000001', 'Reduccion epoxi ', 'material', '25x50', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C26', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fa193521-bc8b-4275-a7be-8f2cfc05bff9', 'a0000000-0000-0000-0000-000000000001', 'Reduccion PVC', 'material', '90x25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('15dfb620-e2b4-41cb-a482-ea5e38cd3b90', 'a0000000-0000-0000-0000-000000000001', 'Reflector Trasero', 'material', 'unidad', 10, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('15dfb620-e2b4-41cb-a482-ea5e38cd3b90', 'a0000000-0000-0000-0000-000000000001', 'Reflector Trasero', 'material', 'unidad', 10, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('92226a34-0110-4c6a-a420-f87d0b2ebfcd', 'a0000000-0000-0000-0000-000000000001', 'Refrigerante ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ce3bf9f6-610a-4e74-a14e-4e51653565c9', 'a0000000-0000-0000-0000-000000000001', 'Reg/ Media (nueva)', 'material', '-', 0, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C60', 'Arriba ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e9d51867-dc99-429e-a65e-061a95d02e66', 'a0000000-0000-0000-0000-000000000001', 'Reg/Alta (viejo)', 'material', '-', 0, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C60', 'Arriba ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f4b9244d-c848-491a-ac92-5fb4fff81f7d', 'a0000000-0000-0000-0000-000000000001', 'Regulador ', 'material', '25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9de9ba2e-4c39-4c71-af33-d7358b6d2646', 'a0000000-0000-0000-0000-000000000001', 'Regulador ', 'material', '20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7654fb82-7fff-4e9c-a823-2078b7ad6cf2', 'a0000000-0000-0000-0000-000000000001', 'Regulador con flexible', 'material', '25', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2bdef5e7-0a71-44bc-a0c0-5880677904a6', 'a0000000-0000-0000-0000-000000000001', 'Regulador con manguera', 'material', '18', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f585bc26-6d93-445c-a737-52d2ed247bdc', 'a0000000-0000-0000-0000-000000000001', 'Regulador con manguera', 'material', '22', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('eb50b7a1-94f6-4ae6-a05b-73c47e0deeb7', 'a0000000-0000-0000-0000-000000000001', 'Regulador gnl', 'material', '25', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dca6a74d-e002-4482-af66-81c78006cc31', 'a0000000-0000-0000-0000-000000000001', 'Regulador gnl', 'material', '16', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5d733657-58fe-4acf-afc8-6a5240a53dcd', 'a0000000-0000-0000-0000-000000000001', 'Rejilla para baño', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C37', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3add8146-21cc-4bfc-a406-3b2b18c65c6b', 'a0000000-0000-0000-0000-000000000001', 'Repuesto Ford ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8c01b6de-3abf-48f8-ab66-3705511dd9ad', 'a0000000-0000-0000-0000-000000000001', 'Repuesto Ford ', 'material', 'unidad', 12, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8c01b6de-3abf-48f8-ab66-3705511dd9ad', 'a0000000-0000-0000-0000-000000000001', 'Repuesto Ford ', 'material', 'unidad', 12, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C77', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9b5d2d28-745f-41a9-a9cd-e1e2936e214b', 'a0000000-0000-0000-0000-000000000001', 'Rodamiento Esferico ', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bcb37818-6820-4055-a152-cc38aefff445', 'a0000000-0000-0000-0000-000000000001', 'Rodillos (chicos)', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bcb37818-6820-4055-a152-cc38aefff445', 'a0000000-0000-0000-0000-000000000001', 'Rodillos (chicos)', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('22f05378-8d71-42c8-ac73-d17cfc1502fc', 'a0000000-0000-0000-0000-000000000001', 'Rodillos (grandes)', 'material', 'unidad', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('22f05378-8d71-42c8-ac73-d17cfc1502fc', 'a0000000-0000-0000-0000-000000000001', 'Rodillos (grandes)', 'material', 'unidad', 5, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7c5b85b4-ae51-463e-acd2-2c23f5ff5cfe', 'a0000000-0000-0000-0000-000000000001', 'Rollo Celeste ', 'material', '4mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c363b44b-88b3-48e7-a002-11fb00720fd7', 'a0000000-0000-0000-0000-000000000001', 'Rollo Celeste ', 'material', '2,5mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('459a886a-b957-4016-aafd-7952f2aba3e6', 'a0000000-0000-0000-0000-000000000001', 'Rollo Rojo', 'material', '2,5mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c98c5db4-d64c-4802-a4b2-c56f5e1341dc', 'a0000000-0000-0000-0000-000000000001', 'Rollo UTP', 'material', '33', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('44723199-efd1-4739-a81d-e6d67c4d4a98', 'a0000000-0000-0000-0000-000000000001', 'Rollo UTP ', 'material', '4mm', 1, NULL, NULL, 'cable blanco')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0bcf1744-d582-4da7-a4b3-bc464c5c54b1', 'a0000000-0000-0000-0000-000000000001', 'Rollo Verde ', 'material', '4mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0bcf1744-d582-4da7-a4b3-bc464c5c54b1', 'a0000000-0000-0000-0000-000000000001', 'Rollo Verde ', 'material', '4mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0bcf1744-d582-4da7-a4b3-bc464c5c54b1', 'a0000000-0000-0000-0000-000000000001', 'Rollo Verde ', 'material', '4mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('0bcf1744-d582-4da7-a4b3-bc464c5c54b1', 'a0000000-0000-0000-0000-000000000001', 'Rollo Verde ', 'material', '4mm', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('949f260b-eba4-4314-a440-e54e041901ec', 'a0000000-0000-0000-0000-000000000001', 'Rollos de Alambre', 'material', 'unidad', 3, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('14039791-e95a-4bc8-a774-f7acb085f8a4', 'a0000000-0000-0000-0000-000000000001', 'Rollos de cable ', 'material', '5mm', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('96101be4-6e2a-46aa-a1cb-55f07e6913e0', 'a0000000-0000-0000-0000-000000000001', 'Roseta/cobertor/tapa', 'material', '-', 9, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C33', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d6403fa7-c92c-4e58-ad31-b83c3d700673', 'a0000000-0000-0000-0000-000000000001', 'Roto Martillo ', 'herramienta', 'unidad', 0, NULL, NULL, 'Estan. Herramientas (operativa)')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7d9d66c2-beb7-4d2d-afa0-9bd2abfd1654', 'a0000000-0000-0000-0000-000000000001', 'Rueda p/ventana', 'material', '-', 6, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('577a1c9c-3ca4-48ed-a856-249acaebb964', 'a0000000-0000-0000-0000-000000000001', 'Rueda porton ', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C49', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('577a1c9c-3ca4-48ed-a856-249acaebb964', 'a0000000-0000-0000-0000-000000000001', 'Rueda porton ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C49', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cde37638-2acd-498d-a70a-855938fa0b36', 'a0000000-0000-0000-0000-000000000001', 'Ruedas de andamio', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C60', 'Arriba ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('17ed8c25-2485-4ef3-a391-8087051535fc', 'a0000000-0000-0000-0000-000000000001', 'Rulemanes', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b5fa171e-99f5-48ad-a185-2a21d4782b7a', 'a0000000-0000-0000-0000-000000000001', 'Seda Note', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6f01ba78-6d43-4997-a9ae-1abf76831322', 'a0000000-0000-0000-0000-000000000001', 'Sellador al Agua ', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e99476bb-bbcf-43a0-af66-def50881ecb4', 'a0000000-0000-0000-0000-000000000001', 'Sellador PU construccion', 'material', '300g', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7f5bf3e8-beb5-4a71-a752-a205efa379e5', 'a0000000-0000-0000-0000-000000000001', 'Sellador-Fijador', 'material', 'unidad', 6, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8f6ca35e-d9a3-4eb5-a0c2-e5c0282e81d4', 'a0000000-0000-0000-0000-000000000001', 'Semimascara', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('06a9a5d1-c38d-423e-a881-ad10e804dcea', 'a0000000-0000-0000-0000-000000000001', 'Semimascara', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('06a9a5d1-c38d-423e-a881-ad10e804dcea', 'a0000000-0000-0000-0000-000000000001', 'Semimascara', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3cc1e2c7-3b5e-4549-a225-4901a8190144', 'a0000000-0000-0000-0000-000000000001', 'Sensor de Proxi', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dca46689-9a8e-44eb-ad18-63246091af37', 'a0000000-0000-0000-0000-000000000001', 'Separadores ', 'material', '-', 22, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C66', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dbe910d0-06ee-4f1e-a17c-390a8d6f9c80', 'a0000000-0000-0000-0000-000000000001', 'Sierra de Mano ', 'material', 'unidad', 5, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N2-C1', 'Pasillo 1 Izq ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('206f44f4-237a-46a4-a581-c1a563fb3209', 'a0000000-0000-0000-0000-000000000001', 'Silicona', 'material', '-', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f335972d-c702-4d10-a832-9679e86c4958', 'a0000000-0000-0000-0000-000000000001', 'Silicona de A/temperatura', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('45dbe039-f01d-4bd2-a0ed-e58dfca468e5', 'a0000000-0000-0000-0000-000000000001', 'Silicona liquida ', 'material', 'unidad', 2, NULL, NULL, 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('920dd3ca-7073-4cfd-a840-64c5ff16642e', 'a0000000-0000-0000-0000-000000000001', 'Sistema Push ON', 'material', '-', 6, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('86b86d85-e3c0-4758-a728-6398b7cac6a4', 'a0000000-0000-0000-0000-000000000001', 'Sobrepaso termofusion', 'material', '20', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('41a7d8ff-2107-4fa6-a69d-054e0501251f', 'a0000000-0000-0000-0000-000000000001', 'Sobrepaso termofusion', 'material', '25', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('86b86d85-e3c0-4758-a728-6398b7cac6a4', 'a0000000-0000-0000-0000-000000000001', 'Sobrepaso termofusion', 'material', '20', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('41a7d8ff-2107-4fa6-a69d-054e0501251f', 'a0000000-0000-0000-0000-000000000001', 'Sobrepaso termofusion', 'material', '25', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9fd3d5d9-6734-46ea-aeaf-cf8d44ee44e4', 'a0000000-0000-0000-0000-000000000001', 'Soga', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('057edf34-10d4-4ab1-a81f-f46a82006e69', 'a0000000-0000-0000-0000-000000000001', 'Soga (chica)', 'material', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9f0fd0e3-75bc-490d-a770-46ba6055219f', 'a0000000-0000-0000-0000-000000000001', 'Soga (gruesa)', 'material', 'unidad', 6, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e3de7484-1046-4b92-a22d-0ba744622fa5', 'a0000000-0000-0000-0000-000000000001', 'Solucion Acida', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('85956cfb-cbe9-4ae6-a1c8-007a6cc531ee', 'a0000000-0000-0000-0000-000000000001', 'Sombrerete', 'material', '63', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C39', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3a853738-cca2-4d31-adb9-fdc2d5c6b888', 'a0000000-0000-0000-0000-000000000001', 'Sombrero de gas ', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5bdd1347-ba1a-47b6-af65-63ffee15cabf', 'a0000000-0000-0000-0000-000000000001', 'Sopapa c/rejilla', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('60680214-fd5b-4001-a3a3-73affc9a514c', 'a0000000-0000-0000-0000-000000000001', 'Sopapa c/rejilla', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ea788c1a-9b63-493a-a796-da637b239348', 'a0000000-0000-0000-0000-000000000001', 'Soporte de Banco', 'material', 'unidad', 1, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c1ca0c1a-9171-4f39-ab23-52415344a608', 'a0000000-0000-0000-0000-000000000001', 'Soporte de Fijacion (L)', 'herramienta', 'unidad', 2, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fe1702fe-1e5b-42fb-acd9-e57225662a25', 'a0000000-0000-0000-0000-000000000001', 'Stillson ', 'material', 'unidad', 2, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5a6adc65-2290-4b1e-a225-a42bfea2031f', 'a0000000-0000-0000-0000-000000000001', 'Surtidor bronc', 'material', '-', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('38a43e1c-e649-43f0-a791-4046420b1103', 'a0000000-0000-0000-0000-000000000001', 'T de derivacion ', 'material', '1', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C33', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5621562e-0f1a-4185-a7e7-a5b262ccc663', 'a0000000-0000-0000-0000-000000000001', 'T de servicio autoperforante ', 'material', '25', 21, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C33', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a93f666d-2d84-45c3-abd2-17fc740bff72', 'a0000000-0000-0000-0000-000000000001', 'Tanza ', 'material', '-', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b267b35e-2816-47dc-a6ce-9c0c70d3731d', 'a0000000-0000-0000-0000-000000000001', 'Tapa electrofusion ', 'material', '25', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d4c591a1-bd36-4ac5-a1bd-63a4499148ea', 'a0000000-0000-0000-0000-000000000001', 'Tapa electrofusion ', 'material', '110', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C6', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4f3b19ef-144f-4eb5-ab22-f245563745e2', 'a0000000-0000-0000-0000-000000000001', 'Tapa electrofusion ', 'material', '63', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C9', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('29c0e815-e1fe-45a2-a540-83488ced7f19', 'a0000000-0000-0000-0000-000000000001', 'Tapa electrofusion ', 'material', '50', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C9', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ac980b08-bfe0-4d88-a57e-8b6113862df0', 'a0000000-0000-0000-0000-000000000001', 'Tapa electrofusion ', 'material', '90', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('024ded76-b092-4645-ab42-a62ad0f90811', 'a0000000-0000-0000-0000-000000000001', 'Tapa electrofusion ', 'material', '160', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C21', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ac980b08-bfe0-4d88-a57e-8b6113862df0', 'a0000000-0000-0000-0000-000000000001', 'Tapa electrofusion ', 'material', '90', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C13', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d91d3800-8b64-4dce-ad8d-d865ccf8fb32', 'a0000000-0000-0000-0000-000000000001', 'Tapa H', 'material', '110', 3, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C43', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ea54a3c0-00bc-4847-aea5-fb21762fa421', 'a0000000-0000-0000-0000-000000000001', 'Tapa H', 'material', '160', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C43', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('af3baa4c-2547-4ae1-ace3-0971e3b2ee62', 'a0000000-0000-0000-0000-000000000001', 'Tapa hembra', 'material', '1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c8dbff9d-7a6f-4d30-ad72-1f5c724a610c', 'a0000000-0000-0000-0000-000000000001', 'Tapa M', 'material', '110', 1, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N1-C43', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8d8a2705-edc5-467f-a36f-6a3558a457df', 'a0000000-0000-0000-0000-000000000001', 'Tapa modulo ', 'material', '-', 11, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('672b217c-9e21-47dc-a97a-740f5c8a2f66', 'a0000000-0000-0000-0000-000000000001', 'Tapa PVC', 'material', '60', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3dc0de68-253c-424c-adf3-acb4a9f07e61', 'a0000000-0000-0000-0000-000000000001', 'Tapa PVC', 'material', '50', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C39', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6a790330-39ad-4a33-a195-1d889857487d', 'a0000000-0000-0000-0000-000000000001', 'Tapa Regina', 'material', '50x10', 85, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C49', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1cc88fb6-38e5-498e-a5b7-5aa668b928b5', 'a0000000-0000-0000-0000-000000000001', 'Tapa termofusion', 'material', '110', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b6e51301-e334-414f-a1dd-da1d11934efe', 'a0000000-0000-0000-0000-000000000001', 'Tapaciega  ', 'material', '-', 52, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f4d92b29-bee2-439a-a491-dd651ac0308c', 'a0000000-0000-0000-0000-000000000001', 'Tapaciega (boca) ', 'material', '-', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9c28effe-9854-4910-aabb-4b626f531086', 'a0000000-0000-0000-0000-000000000001', 'Tapaciega (modulo)', 'material', '-', 34, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b78e8aa5-9c34-411c-a59b-8b44c86a74e4', 'a0000000-0000-0000-0000-000000000001', 'Tapas plastica gris rectangular', 'material', '-', 4, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5763b185-1991-4577-a6d3-c9a6b2f8269c', 'a0000000-0000-0000-0000-000000000001', 'Tapon', 'material', '1/2', 12, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('43fd7666-f143-4745-ab3c-ee0274b58f42', 'a0000000-0000-0000-0000-000000000001', 'Tapon', 'material', '3/4', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('de83d431-cd3f-40e0-ad0d-ede3ddaa95b7', 'a0000000-0000-0000-0000-000000000001', 'Tapon', 'material', '110', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('890e76d2-63af-4b39-a5b2-f5a729f5af3b', 'a0000000-0000-0000-0000-000000000001', 'Tapon de Oide', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('890e76d2-63af-4b39-a5b2-f5a729f5af3b', 'a0000000-0000-0000-0000-000000000001', 'Tapon de Oide', 'material', 'unidad', 4, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('149cd27c-c17c-4815-a296-d0812276c7f8', 'a0000000-0000-0000-0000-000000000001', 'Tapon hembra ', 'material', '54', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9e8d75ef-c6d9-47ae-adb8-e88e3efec40a', 'a0000000-0000-0000-0000-000000000001', 'Tapon hembra epoxi', 'material', '3/4', 27, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7a5c6b15-2c04-4d9b-adf7-c1e904510612', 'a0000000-0000-0000-0000-000000000001', 'Tapon hembra epoxi', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C31', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('21a816c9-f249-480c-ab4d-eb1b1a0a1819', 'a0000000-0000-0000-0000-000000000001', 'Tapon hermbra', 'material', '1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fd016fe9-d414-4527-a916-79f119065f39', 'a0000000-0000-0000-0000-000000000001', 'Tapon macho epoxi', 'material', '56', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e2d94c31-82a7-42bb-ad35-963658531389', 'a0000000-0000-0000-0000-000000000001', 'Tapon macho epoxi', 'material', '73', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9e09572c-bc86-4465-a627-2eaed50e2c68', 'a0000000-0000-0000-0000-000000000001', 'Tapon macho epoxi', 'material', '3/4', 33, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9bda7399-7131-4689-a505-14171570eacb', 'a0000000-0000-0000-0000-000000000001', 'Tapon macho epoxi', 'material', '19', 19, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1a1b2a0a-4ae3-41f0-aa0d-a49a0a92d535', 'a0000000-0000-0000-0000-000000000001', 'Tapon macho epoxi', 'material', '31', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9dcf8574-d380-44f6-a23a-205e10835be9', 'a0000000-0000-0000-0000-000000000001', 'Tapon macho epoxi', 'material', '41', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('d7ac426f-83e6-4103-a5a0-6fc9a3f5c2d7', 'a0000000-0000-0000-0000-000000000001', 'Tapon macho epoxi', 'material', '40', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c68d5180-eb8a-4150-aa5d-2b2ea9cec8a1', 'a0000000-0000-0000-0000-000000000001', 'Tapon PVC ', 'material', '110', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('7cc56931-5bb3-49dc-ae78-06a8cf1711f4', 'a0000000-0000-0000-0000-000000000001', 'Tapon roscado termofusion', 'material', '32', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('38c5f850-b52d-4978-a12f-2c9eaa87dcb8', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion', 'material', '50', 23, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a5a99942-8296-423a-af6a-f8245d8fa05d', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion', 'material', '125', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c349cacb-5225-46dc-a8df-325933a53091', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion', 'material', '90', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6acb8127-b6c2-41e3-af8e-bebdd0f63d8d', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion', 'material', '20', 6, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4f7c93be-00b4-45c7-acf1-a21a95611031', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion', 'material', '25', 10, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b3a6b290-fb54-46a1-a153-15ec23b6f27f', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion', 'material', '25', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c869ff59-9967-4730-a060-905b5fb92143', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion', 'material', '20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('538245e7-f7b2-4232-af85-b80238782550', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion ', 'material', '75', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1ba2c6a2-3aa1-48a6-a0de-984f742216f3', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion amarillo', 'material', '63', 6, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a81a536c-24be-4dc0-af1f-dcd8e1c415b9', 'a0000000-0000-0000-0000-000000000001', 'Tapon termofusion negro', 'material', '63', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('c4fb4232-a36b-4acd-ab45-3fd0659f52ac', 'a0000000-0000-0000-0000-000000000001', 'Tela carpintera', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2b5731fc-7bc6-416b-a7da-072dbb19930b', 'a0000000-0000-0000-0000-000000000001', 'Termica bipolar ', 'material', '20', 6, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('df5b86c7-af2c-416a-a7f8-eb001e249127', 'a0000000-0000-0000-0000-000000000001', 'Termica bipolar ', 'material', '25', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('97f2641a-fc46-4808-acf3-e3cb4b5d9bb1', 'a0000000-0000-0000-0000-000000000001', 'Termica tetrapolar', 'material', '20', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C52', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5d18d8b9-7757-4033-a728-bc8486e4771b', 'a0000000-0000-0000-0000-000000000001', 'Termocontrable', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C48', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f7e56ce5-67cf-4d9e-a75d-1a603b4cb05d', 'a0000000-0000-0000-0000-000000000001', 'Termocupla sin soporte', 'material', '400', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C33', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('06f23780-527b-4847-aec5-85ca92621131', 'a0000000-0000-0000-0000-000000000001', 'Termocupla sin soporte', 'material', '300', 8, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C33', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1693c56a-5f39-4bce-a076-044019717c00', 'a0000000-0000-0000-0000-000000000001', 'Termometro ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('1693c56a-5f39-4bce-a076-044019717c00', 'a0000000-0000-0000-0000-000000000001', 'Termometro ', 'material', 'unidad', 1, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8dfb749c-49f2-4c34-a23c-2d7d73842d5c', 'a0000000-0000-0000-0000-000000000001', 'Thinner ', 'material', 'unidad', 6, NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('81c49d94-0df9-42ca-aaeb-e18f70d712c5', 'a0000000-0000-0000-0000-000000000001', 'Timer digital ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bb628500-cfda-40e3-a82b-326327b1cccd', 'a0000000-0000-0000-0000-000000000001', 'Tira led ', 'material', '0.5', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C58', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a1e564cf-7f0d-4a35-abb4-a75a9d3b170b', 'a0000000-0000-0000-0000-000000000001', 'Tira led ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('77b58eee-7b2e-466f-a3f0-131a9b734b4d', 'a0000000-0000-0000-0000-000000000001', 'Toma de perfil', 'material', '90x125', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('892836b8-9f43-49d5-a218-6fd4cf6c9284', 'a0000000-0000-0000-0000-000000000001', 'Toma de perfil', 'material', '63', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C65', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2f5717de-f6ae-43b0-a244-dd20c4278713', 'a0000000-0000-0000-0000-000000000001', 'Toma doble', 'material', '-', 33, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C49', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3ffb7247-a223-41a1-a731-1762d1ffa838', 'a0000000-0000-0000-0000-000000000001', 'Toma simple H', 'material', '-', 8, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C56', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('61db74aa-40ef-4443-a277-a7d2eb068a2c', 'a0000000-0000-0000-0000-000000000001', 'Toma telef.', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2af8409d-4173-4cb3-a88a-912593ceebea', 'a0000000-0000-0000-0000-000000000001', 'Tornillo y capeloto', 'material', '-', 44, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N2-C46', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('dc12234b-50f9-4ca8-ae31-339a28be1ebf', 'a0000000-0000-0000-0000-000000000001', 'Transformador ', 'material', '12v', 3, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N1-C59', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3c7f6518-1777-4db5-ab90-3c080dd26b10', 'a0000000-0000-0000-0000-000000000001', 'Tripode aluminio', 'material', 'unidad', 2, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N2-C86', 'Pasillo 1 Izq ')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('21f70a11-bd3e-4ec7-ae34-cf0db0eb21d7', 'a0000000-0000-0000-0000-000000000001', 'Tubo con inserto ', 'material', '40', 1, '2157d56d-6aff-408a-a90c-869526290656', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cd97aa10-0a8c-469d-aa77-fd4b0699136e', 'a0000000-0000-0000-0000-000000000001', 'Tubo con inserto ', 'material', '20', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5635a96d-bcdc-4fe7-a772-b1d79a3b9f23', 'a0000000-0000-0000-0000-000000000001', 'Tubo con inserto ', 'material', '25x3/4', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('3b3f3bf9-a15c-4dad-a2b2-ee3f562a1c4e', 'a0000000-0000-0000-0000-000000000001', 'Tubo con inserto termofusion', 'material', '20x1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C23', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('17247869-9261-4a4a-a7aa-38d2d453e4d0', 'a0000000-0000-0000-0000-000000000001', 'Tubo Fluorecente', 'material', '8w', 2, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C61', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b823b47f-78ff-46ee-a7f3-22946e3c48ff', 'a0000000-0000-0000-0000-000000000001', 'Tubo Fluorecente', 'material', '18w', 0, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N3-C62', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('47545690-5c15-479a-afa3-84afde0f4518', 'a0000000-0000-0000-0000-000000000001', 'Tubo inserto termofusion', 'material', '20x1/2', 12, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('8e18aea8-d76e-4e03-a78c-d86dd452c7e4', 'a0000000-0000-0000-0000-000000000001', 'Tubo inserto termofusion', 'material', '20', 12, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ce1c779e-df94-44e2-a47b-6ff46d3e20d9', 'a0000000-0000-0000-0000-000000000001', 'Tuerca  epoxi', 'material', '46', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('100b0165-2b9e-4f35-a91f-8ace3816cbc9', 'a0000000-0000-0000-0000-000000000001', 'Tuerca epoxi', 'material', '50', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e088c76d-84e2-48de-ab6a-76e6814db071', 'a0000000-0000-0000-0000-000000000001', 'Tuerca epoxi', 'material', '38', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('b0c33b16-c2cb-4c10-af77-bb69e659ee0a', 'a0000000-0000-0000-0000-000000000001', 'Tuerca epoxi', 'material', '30', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('2e680c28-502f-421c-a629-3d66c94ef66e', 'a0000000-0000-0000-0000-000000000001', 'Tuerca plana epoxi', 'material', '60', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C22', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5c5c8163-69be-490a-aee6-550d664a1808', 'a0000000-0000-0000-0000-000000000001', 'Tuerca plana epoxi', 'material', '37', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('51518163-7577-47bb-afde-12a4b43146bb', 'a0000000-0000-0000-0000-000000000001', 'Tuerca plana epoxi', 'material', '36', 5, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a25c7303-77a1-4bdc-a392-d46665132465', 'a0000000-0000-0000-0000-000000000001', 'Tuerca plana epoxi', 'material', '53', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5dea0427-d124-4810-ac51-51810e1de59e', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '1/2', 7, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5e3c68f5-f85a-41eb-a5d8-a54770c20775', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '34', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C24', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ec4243b3-b03b-4b52-a5b5-73350039a494', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '1', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6a856192-7eed-4d2e-af6a-c6eda7629e77', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '3/4', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C34', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ec4243b3-b03b-4b52-a5b5-73350039a494', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '1', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C25', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4af8187a-3403-4410-aa19-4e7d0848d6c7', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('38b79232-3ac2-46fb-ac81-29512c3196d1', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '25', 6, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4d3bedb5-c3e9-4b45-afb9-66fd0b896cb8', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '15x20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C35', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('27866bf8-f8de-4c77-ac52-9bfcb848e4f3', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '1 x 1/2', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6a856192-7eed-4d2e-af6a-c6eda7629e77', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '3/4', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9e0e2797-c926-47d2-ab52-6bdec62b27b5', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '1/2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('4af8187a-3403-4410-aa19-4e7d0848d6c7', 'a0000000-0000-0000-0000-000000000001', 'Union doble ', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C15', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('361a79fa-d1cf-4748-a811-cb74843c6dcb', 'a0000000-0000-0000-0000-000000000001', 'Vaina Protectora ', 'material', '-', 49, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C28', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fad24072-352e-4e2a-ad00-1893f1cc4633', 'a0000000-0000-0000-0000-000000000001', 'Valiza luminosa ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('673ea1c2-0eb5-4af4-a7ce-a0308b234107', 'a0000000-0000-0000-0000-000000000001', 'Valiza Luminosa ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C78', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('fad24072-352e-4e2a-ad00-1893f1cc4633', 'a0000000-0000-0000-0000-000000000001', 'Valiza luminosa ', 'material', 'unidad', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('673ea1c2-0eb5-4af4-a7ce-a0308b234107', 'a0000000-0000-0000-0000-000000000001', 'Valiza Luminosa ', 'material', 'unidad', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C78', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cb5b8534-dfd7-4220-af52-760c845a4ee3', 'a0000000-0000-0000-0000-000000000001', 'Valiza rotativa Emergencia ', 'material', 'unidad', 4, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('cb5b8534-dfd7-4220-af52-760c845a4ee3', 'a0000000-0000-0000-0000-000000000001', 'Valiza rotativa Emergencia ', 'material', 'unidad', 4, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bd22896e-bf39-42b1-a799-0ac7b7c5e5f4', 'a0000000-0000-0000-0000-000000000001', 'Valv de Alivio de Precion ', 'material', 'unidad', 0, '48ed5d2d-b392-47d7-ae5e-829b17581629', 'N4-C85', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('25281808-ee6b-40e9-a026-c9be5b0cf52c', 'a0000000-0000-0000-0000-000000000001', 'Valvula de alivio ', 'material', '24', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C32', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9ea5103d-f68b-45bb-a8e6-391c9a35be47', 'a0000000-0000-0000-0000-000000000001', 'Valvula de Serv 63-63 gal ', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C18', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9ea5103d-f68b-45bb-a8e6-391c9a35be47', 'a0000000-0000-0000-0000-000000000001', 'Valvula de Serv 63-63 gal ', 'material', 'unidad', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C18', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('90171806-9914-48a9-a2e3-216ea1a7ac37', 'a0000000-0000-0000-0000-000000000001', 'Valvula de servicio electrofusion', 'material', '125x32', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C5', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('639f160c-135f-4a2a-a0c5-ffa4c1d897f8', 'a0000000-0000-0000-0000-000000000001', 'Valvula de servicio electrofusion', 'material', '90x25', 15, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N2-C16', '2 incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('958dc23f-2992-4eae-a918-adcf9cfac7de', 'a0000000-0000-0000-0000-000000000001', 'Valvula de servicio electrofusion ', 'material', '63x25', 21, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C12', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('45ceed1a-77ff-4753-acb6-2cc0b58a3f57', 'a0000000-0000-0000-0000-000000000001', 'Valvula de servicio electrofusion ', 'material', '50x25', 52, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C1,2,3,4', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ea823940-4c8c-43cb-ac05-576cfd18ff6f', 'a0000000-0000-0000-0000-000000000001', 'Valvula de servicio electrofusion ', 'material', '90x25', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N1-C2', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('88791f00-52cc-455b-a995-377399c7ba53', 'a0000000-0000-0000-0000-000000000001', 'Valvula descarga inodoro', 'material', '1 1/2', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('e64d7368-f8bb-4785-a206-05233f9aece0', 'a0000000-0000-0000-0000-000000000001', 'Valvula descarga inodoro', 'material', '-', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C38', 'incompleta')
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('bf7bf512-3b9d-4e0f-a8c9-d28827a564d2', 'a0000000-0000-0000-0000-000000000001', 'Valvula Entrada', 'material', '-', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C37', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('eb5599f0-091b-4592-ab80-3b1d0c036682', 'a0000000-0000-0000-0000-000000000001', 'Valvula esferica', 'material', '2', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('13a270c2-13b5-407c-a924-4fcf2a365bd7', 'a0000000-0000-0000-0000-000000000001', 'Valvula esferica gnc', 'material', '3/4', 26, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C29', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('f74becac-400e-47fa-afb1-46730940535c', 'a0000000-0000-0000-0000-000000000001', 'Valvula esferica gnl', 'material', '13', 3, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C29', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9930ae21-2a36-4dec-a4ff-81224e992385', 'a0000000-0000-0000-0000-000000000001', 'Valvula esferica gnl', 'material', '32', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C29', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('76d3e16f-d7d6-4b7e-a83b-a60efed3c7f4', 'a0000000-0000-0000-0000-000000000001', 'Valvula esferica gnl', 'material', '76x20', 1, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C29', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('132ab9c1-f555-4014-ab51-4df3fa4a2937', 'a0000000-0000-0000-0000-000000000001', 'Valvula espiga', 'material', '1/2', 10, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('a9c9b84e-b0e5-4ae5-aa01-e1b72d84b07e', 'a0000000-0000-0000-0000-000000000001', 'Valvula espiga', 'material', '3/4', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('5e582572-7b78-4d4b-a9ad-d40212ec87df', 'a0000000-0000-0000-0000-000000000001', 'Valvula espiga', 'material', '1', 2, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('ad7c4375-1267-4007-a5e3-5e22624d8531', 'a0000000-0000-0000-0000-000000000001', 'Valvula termofusion', 'material', '20', 4, '560fce20-abef-4cd3-a8e4-d13c94669a46', 'N3-C36', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('27cfb092-cb45-471c-ac69-6e2c16828f25', 'a0000000-0000-0000-0000-000000000001', 'Varilla Enroscada', 'material', '6mm', 6, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('6f05975e-cbd5-4251-aa43-f3eff0b09460', 'a0000000-0000-0000-0000-000000000001', 'Varilla ENroscada', 'material', '12mm', 3, 'f9f2d672-039e-45d0-a839-b769ad71e1b0', 'N1-C1', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('01602e48-430c-4f94-ab2b-b8978bc1bd63', 'a0000000-0000-0000-0000-000000000001', 'Vaselina Liquida ', 'material', '-', 1, 'b29bcbb0-f188-4009-a434-a5f213285f46', 'N4-C66', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9b79b29b-e622-455a-a701-649b510cadab', 'a0000000-0000-0000-0000-000000000001', 'Ventiladpr Radiador ', 'material', 'unidad', 1, '24711631-9466-47be-a6c6-ac3ab87984cb', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
INSERT INTO inventory_items (id, tenant_id, name, category, unit, current_stock, shelf_id, shelf_position, notes)
VALUES ('9b79b29b-e622-455a-a701-649b510cadab', 'a0000000-0000-0000-0000-000000000001', 'Ventiladpr Radiador ', 'material', 'unidad', 1, '4950a628-7d75-402a-a6b3-a32c5d0b2188', 'N4-C78', NULL)
ON CONFLICT (id) DO NOTHING;
