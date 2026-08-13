import { Platform, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/lib/hooks/use-theme';
import { Collapsible } from '@/shared/ui/collapsible';
import { ThemedText } from '@/shared/ui/themed-text';
import { ThemedView } from '@/shared/ui/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/shared/ui/theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">Explore</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Project scaffold using Feature-Sliced Design.
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title="File-based routing">
            <ThemedText type="small">
              Routes live in <ThemedText type="code">app/</ThemedText> at the project root.
              Application code follows FSD layers under <ThemedText type="code">src/</ThemedText>.
            </ThemedText>
          </Collapsible>

          <Collapsible title="FSD layers">
            <ThemedText type="small">
              Dependency flow: <ThemedText type="code">app → widgets → features → entities → shared</ThemedText>.
              The Expo Router folder is separate from the FSD app layer (<ThemedText type="code">src/_app/</ThemedText>).
            </ThemedText>
          </Collapsible>

          <Collapsible title="Light and dark mode">
            <ThemedText type="small">
              Theme tokens live in <ThemedText type="code">src/shared/ui/theme/</ThemedText> and will be
              overridden per client via <ThemedText type="code">src/_app/config/brand.config.ts</ThemedText>.
            </ThemedText>
          </Collapsible>
        </ThemedView>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
});
