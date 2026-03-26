DELETE FROM public.property_single_value
WHERE property_id IN ('property0008', 'property0009', 'property1007');

DELETE FROM public.property_multi_value
WHERE property_id IN ('property0008', 'property0009', 'property1007');

UPDATE public.issue
SET
  property_values = COALESCE(property_values, '{}'::jsonb) - 'property0008' - 'property0009' - 'property1007',
  updated_at = NOW()
WHERE property_values ?| ARRAY['property0008', 'property0009', 'property1007'];

DELETE FROM public.property
WHERE id IN ('property0008', 'property0009', 'property1007');
