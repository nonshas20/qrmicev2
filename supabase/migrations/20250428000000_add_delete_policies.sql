-- Add DELETE policies for students, events, and attendance tables

-- Students delete policy
CREATE POLICY "Authenticated users can delete students" 
ON students FOR DELETE 
TO authenticated 
USING (true);

-- Events delete policy
CREATE POLICY "Authenticated users can delete their events" 
ON events FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Attendance delete policy
CREATE POLICY "Authenticated users can delete attendance" 
ON attendance FOR DELETE 
TO authenticated 
USING (true);
