import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ParentRegisterStartScreen } from '../screens/ParentRegisterStartScreen';
import { ParentRegisterFormScreen } from '../screens/ParentRegisterFormScreen';
import { TeacherRegisterScreen } from '../screens/TeacherRegisterScreen';
import { ParentDashboardScreen } from '../screens/ParentDashboardScreen';
import { ParentMarketplaceScreen } from '../screens/ParentMarketplaceScreen';
import { ParentStudentsScreen } from '../screens/ParentStudentsScreen';
import { ParentClassesScreen } from '../screens/ParentClassesScreen';
import { TeacherDashboardScreen } from '../screens/TeacherDashboardScreen';
import { TeacherBatchesScreen } from '../screens/TeacherBatchesScreen';
import { TeacherClassesScreen } from '../screens/TeacherClassesScreen';
import { StudentDashboardScreen } from '../screens/StudentDashboardScreen';
import { StudentCoursesScreen } from '../screens/StudentCoursesScreen';
import { StudentClassesScreen } from '../screens/StudentClassesScreen';
import { StudentExamsScreen } from '../screens/StudentExamsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { CmsPageScreen } from '../screens/CmsPageScreen';
import { ForYouScreen } from '../screens/ForYouScreen';
import { ErrorScreen } from '../screens/ErrorScreen';
import { AppHeader } from '../components/AppHeader';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="ParentDashboard" component={ParentDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="ParentMarketplace" component={ParentMarketplaceScreen} options={{ tabBarLabel: 'Marketplace' }} />
      <Tab.Screen name="ParentStudents" component={ParentStudentsScreen} options={{ tabBarLabel: 'My Kids' }} />
      <Tab.Screen name="ParentClasses" component={ParentClassesScreen} options={{ tabBarLabel: 'Classes' }} />
    </Tab.Navigator>
  );
}

function TeacherTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="TeacherDashboard" component={TeacherDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="TeacherBatches" component={TeacherBatchesScreen} options={{ tabBarLabel: 'Batches' }} />
      <Tab.Screen name="TeacherClasses" component={TeacherClassesScreen} options={{ tabBarLabel: 'Classes' }} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        header: () => <AppHeader />,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="StudentDashboard" component={StudentDashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="StudentCourses" component={StudentCoursesScreen} options={{ tabBarLabel: 'Courses' }} />
      <Tab.Screen name="StudentClasses" component={StudentClassesScreen} options={{ tabBarLabel: 'Classes' }} />
      <Tab.Screen name="StudentExams" component={StudentExamsScreen} options={{ tabBarLabel: 'Exams' }} />
    </Tab.Navigator>
  );
}

function MainScreen() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (user?.role === 'parent') {
    return <ParentTabs />;
  }
  if (user?.role === 'teacher') {
    return <TeacherTabs />;
  }
  if (user?.role === 'student') {
    return <StudentTabs />;
  }

  return <HomeScreen />;
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          header: () => <AppHeader />,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Error"
          component={ErrorScreen}
          options={{ headerShown: false }}
          initialParams={{ type: 'generic' }}
        />
        <Stack.Screen name="Login" component={LoginScreen} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ParentRegister" component={ParentRegisterStartScreen} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ParentRegisterForm" component={ParentRegisterFormScreen} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="TeacherRegister" component={TeacherRegisterScreen} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="AboutUs" component={() => <CmsPageScreen slug="about-us" links={[{ label: 'Contact Us', screen: 'ContactUs' }, { label: 'FAQ', screen: 'Faq' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ContactUs" component={() => <CmsPageScreen slug="contact-us" links={[{ label: 'About Us', screen: 'AboutUs' }, { label: 'FAQ', screen: 'Faq' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="Faq" component={() => <CmsPageScreen slug="faq" links={[{ label: 'About Us', screen: 'AboutUs' }, { label: 'Contact Us', screen: 'ContactUs' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ForYou" component={ForYouScreen} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="Features" component={() => <CmsPageScreen slug="features" links={[{ label: 'How It Works', screen: 'HowItWorks' }, { label: 'About Us', screen: 'AboutUs' }, { label: 'Contact Us', screen: 'ContactUs' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="HowItWorks" component={() => <CmsPageScreen slug="how-it-works" links={[{ label: 'Features', screen: 'Features' }, { label: 'About Us', screen: 'AboutUs' }, { label: 'Contact Us', screen: 'ContactUs' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ForParents" component={() => <CmsPageScreen slug="for-parents" links={[{ label: 'For Students', screen: 'ForStudents' }, { label: 'For Teachers', screen: 'ForTeachers' }, { label: 'For You', screen: 'ForYou' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ForStudents" component={() => <CmsPageScreen slug="for-students" links={[{ label: 'For Parents', screen: 'ForParents' }, { label: 'For Teachers', screen: 'ForTeachers' }, { label: 'For You', screen: 'ForYou' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ForTeachers" component={() => <CmsPageScreen slug="for-teachers" links={[{ label: 'For Parents', screen: 'ForParents' }, { label: 'For Students', screen: 'ForStudents' }, { label: 'For You', screen: 'ForYou' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="PrivacyPolicy" component={() => <CmsPageScreen slug="privacy-policy" links={[{ label: 'Terms & Conditions', screen: 'TermsConditions' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="TermsConditions" component={() => <CmsPageScreen slug="terms-conditions" links={[{ label: 'Privacy Policy', screen: 'PrivacyPolicy' }]} />} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
        <Stack.Screen name="ParentMarketplace" component={ParentMarketplaceScreen} />
        <Stack.Screen name="ParentStudents" component={ParentStudentsScreen} />
        <Stack.Screen name="ParentClasses" component={ParentClassesScreen} />
        <Stack.Screen name="TeacherDashboard" component={TeacherDashboardScreen} />
        <Stack.Screen name="TeacherBatches" component={TeacherBatchesScreen} />
        <Stack.Screen name="TeacherClasses" component={TeacherClassesScreen} />
        <Stack.Screen name="StudentDashboard" component={StudentDashboardScreen} />
        <Stack.Screen name="StudentCourses" component={StudentCoursesScreen} />
        <Stack.Screen name="StudentClasses" component={StudentClassesScreen} />
        <Stack.Screen name="StudentExams" component={StudentExamsScreen} />
        <Stack.Screen name="ParentPrivacy" component={PrivacyScreen} options={{ header: () => <AppHeader showBack /> }} />
        <Stack.Screen name="TeacherPrivacy" component={PrivacyScreen} options={{ header: () => <AppHeader showBack /> }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
