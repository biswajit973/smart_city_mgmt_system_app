import { StyleSheet, Text, View } from 'react-native';

const ORANGE = '#E87A1D';

export default function GrievanceRedressalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Grievance Redressal</Text>
      {/* Add grievance redressal form or options here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#181A20',
  },
  button: {
    backgroundColor: ORANGE,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: ORANGE,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
});
